import MarketForm from '../_form';

export default function CreateMarketPage() {
  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: '#fff' }}>Créer un marché</h1>
        <p className="text-sm mt-0.5" style={{ color: '#4a5380' }}>
          Remplissez tous les champs ci-dessous pour publier un nouveau pari
        </p>
      </div>
      <MarketForm mode="create" />
    </div>
  );
}
