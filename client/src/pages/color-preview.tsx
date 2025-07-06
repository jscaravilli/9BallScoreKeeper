import BilliardsColorSwatch from "@/components/billiards-color-swatch";

export default function ColorPreview() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Billiards Color Preview</h1>
      <BilliardsColorSwatch />
    </div>
  );
}