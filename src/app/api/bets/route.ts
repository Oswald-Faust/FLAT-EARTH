import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Bet from '@/models/Bet';
import Market from '@/models/Market';
import User from '@/models/User';
import MarketHistory from '@/models/MarketHistory';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    await connectDB();
    const body = await req.json();
    const { marketId, optionId, amount } = body;

    if (!marketId || !optionId || !amount) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }
    if (amount < 1) {
      return NextResponse.json({ error: 'Mise minimum : 1 €' }, { status: 400 });
    }

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      // Vérifier l'utilisateur et le solde wallet
      const user = await User.findById(userId).session(mongoSession);
      if (!user) throw new Error('Utilisateur introuvable');

      const amountCents = Math.round(amount * 100);
      if ((user.balance ?? 0) < amountCents) {
        throw new Error(`Solde insuffisant (${((user.balance ?? 0) / 100).toFixed(2)} € disponible)`);
      }

      // Vérifier le marché
      const market = await Market.findById(marketId).session(mongoSession);
      if (!market) throw new Error('Marché introuvable');
      if (market.status === 'closed' || market.status === 'resolved') {
        throw new Error('Ce marché est fermé');
      }
      if (market.approvalStatus !== 'approved') {
        throw new Error('Ce marché n\'est pas encore approuvé');
      }

      const option = market.options.find(
        (o: { _id: { toString(): string } }) => o._id.toString() === optionId
      );
      if (!option) throw new Error('Option invalide');

      // Calcul des gains potentiels
      const odds         = parseFloat((100 / option.probability).toFixed(2));
      const potentialWin = parseFloat((amount * odds).toFixed(2));

      // Débiter le wallet
      user.balance -= amountCents;
      await user.save({ session: mongoSession });

      // Créer le pari
      const [bet] = await Bet.create(
        [{ userId, marketId, optionId, amount, odds, potentialWin, status: 'pending' }],
        { session: mongoSession }
      );

      // Mise à jour du volume + probabilités
      market.totalVolume += amount;
      option.totalBets   += amount;

      const totalBets = market.options.reduce(
        (sum: number, o: { totalBets: number }) => sum + o.totalBets, 0
      );
      market.options.forEach((o: { totalBets: number; probability: number }) => {
        o.probability = totalBets > 0 ? Math.round((o.totalBets / totalBets) * 100) : 50;
      });

      await market.save({ session: mongoSession });

      // Snapshot historique (pour les graphes)
      await MarketHistory.create(
        [{
          marketId,
          probabilities: market.options.map((o: { _id: { toString(): string }; probability: number }) => ({
            optionId:    o._id.toString(),
            probability: o.probability,
          })),
          recordedAt: new Date(),
        }],
        { session: mongoSession }
      );

      await mongoSession.commitTransaction();
      return NextResponse.json({ bet, potentialWin }, { status: 201 });

    } catch (err) {
      await mongoSession.abortTransaction();
      throw err;
    } finally {
      mongoSession.endSession();
    }

  } catch (error) {
    console.error('[POST /api/bets]', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
