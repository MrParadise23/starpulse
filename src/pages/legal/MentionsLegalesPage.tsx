import LegalLayout from './LegalLayout'

const S = ({ children, t }: { children: React.ReactNode; t: string }) => (
  <section style={{ marginBottom:32 }}>
    <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, color:'#1a1a18', margin:'0 0 12px' }}>{t}</h2>
    {children}
  </section>
)

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" lastUpdated="20 mars 2026">

      <S t="1. Éditeur du site">
        <p>Le site <strong>star-pulse.com</strong> (ci-après « le Site ») est édité par :</p>
        <p><strong>Louis Rocca Serra EI</strong> (Entrepreneur individuel, micro-entreprise)<br/>SIRET : 92872729600016<br/>Code NAF : 7311Z<br/>Bonifacio, France</p>
        <p style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:12, padding:'12px 16px', margin:'12px 0', fontSize:13, color:'#92400e' }}>
          ⚠️ L'adresse complète du siège sera ajoutée prochainement.
        </p>
        <p>Email de contact : <strong>contact@star-pulse.com</strong></p>
        <p>Directeur de la publication : <strong>Louis Rocca Serra</strong></p>
      </S>

      <S t="2. Hébergeur">
        <p>Le site est hébergé par :</p>
        <p><strong>Vercel Inc.</strong><br/>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br/>Site web : vercel.com</p>
        <p>Les données sont stockées par <strong>Supabase Inc.</strong>, 970 Toa Payoh North #07-04, Singapore 318992.</p>
      </S>

      <S t="3. Propriété intellectuelle">
        <p>L'ensemble des contenus présents sur le Site (textes, images, logos, icônes, logiciels, base de données) est protégé par les lois en vigueur sur la propriété intellectuelle. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation écrite préalable, est interdite.</p>
        <p>La marque StarPulse et le logo associé sont la propriété de l'éditeur.</p>
      </S>

      <S t="4. Responsabilité">
        <p>L'éditeur s'efforce d'assurer l'exactitude des informations diffusées sur le Site, mais ne saurait être tenu responsable des omissions, inexactitudes ou carences dans la mise à jour. L'éditeur ne pourra être tenu responsable des dommages directs ou indirects résultant de l'utilisation du Site.</p>
      </S>

      <S t="5. Liens hypertextes">
        <p>Le Site peut contenir des liens vers des sites tiers. L'éditeur n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.</p>
      </S>

      <S t="6. Droit applicable">
        <p>Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
      </S>

    </LegalLayout>
  )
}
