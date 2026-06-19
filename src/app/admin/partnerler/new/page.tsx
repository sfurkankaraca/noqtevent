import PartnerForm from "../PartnerForm";

export default function NewPartnerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Yeni Partner</h1>
        <p className="text-sm text-muted-foreground mt-1">Yeni bir hizmet ortağı ekle</p>
      </div>
      <PartnerForm />
    </div>
  );
}
