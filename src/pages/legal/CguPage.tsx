import LegalLayout from './LegalLayout'

const S = ({ children, t }: { children: React.ReactNode; t: string }) => (
  <section style={{ marginBottom:32 }}>
    <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, color:'#1a1a18', margin:'0 0 12px' }}>{t}</h2>
    {children}
  </section>
)

export default function CguPage() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation" lastUpdated="20 mars 2026">

      <S t="1. Objet">
        <p>Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») définissent les modalités d'accès et d'utilisation de la plateforme StarPulse accessible à l'adresse star-pulse.com (ci-après « le Service »). En créant un compte, l'Utilisateur accepte sans réserve les présentes CGU.</p>
      </S>

      <S t="2. Accès au Service">
        <p>L'accès au Service nécessite la création d'un compte utilisateur avec une adresse email valide et un mot de passe. L'Utilisateur est responsable de la confidentialité de ses identifiants de connexion et de toutes les actions effectuées depuis son compte.</p>
        <p>StarPulse se réserve le droit de suspendre ou de supprimer un compte en cas de violation des présentes CGU, sans préavis ni indemnité.</p>
      </S>

      <S t="3. Description du Service">
        <p>StarPulse fournit une plateforme en ligne permettant aux commerces physiques de collecter et gérer les avis de leurs clients via des tags NFC et QR codes, de recevoir des retours privés, de suivre leur réputation en ligne et de générer des réponses automatisées aux avis grâce à l'intelligence artificielle.</p>
      </S>

      <S t="4. Obligations de l'Utilisateur">
        <p>L'Utilisateur s'engage à :</p>
        <p>Fournir des informations exactes et à jour lors de l'inscription et de la configuration de son établissement. Utiliser le Service de manière conforme aux lois et réglementations en vigueur. Ne pas utiliser le Service pour générer de faux avis, manipuler les notations, ou toute pratique contraire à l'éthique commerciale. Ne pas tenter de contourner les mesures de sécurité du Service. Ne pas revendre, sous-licencier ou mettre à disposition le Service à des tiers non autorisés.</p>
      </S>

      <S t="5. Contenu de l'Utilisateur">
        <p>L'Utilisateur est seul responsable des contenus qu'il publie ou génère via le Service (informations d'établissement, réponses aux avis, logos, etc.). StarPulse ne saurait être tenu responsable des contenus publiés par les Utilisateurs.</p>
        <p>L'Utilisateur accorde à StarPulse une licence non exclusive et non transférable d'utilisation de ses contenus dans le cadre strict du fonctionnement du Service.</p>
      </S>

      <S t="6. Réponses IA">
        <p>Le Service propose des suggestions de réponses générées par intelligence artificielle (OpenAI). Ces suggestions sont fournies à titre indicatif. L'Utilisateur est seul responsable de la relecture, de la validation et de la publication de ces réponses. StarPulse ne garantit pas l'exactitude, la pertinence ou l'adéquation des réponses générées automatiquement.</p>
      </S>

      <S t="7. Disponibilité du Service">
        <p>StarPulse s'efforce d'assurer la disponibilité du Service 24h/24 et 7j/7. Toutefois, l'accès peut être interrompu temporairement pour des opérations de maintenance, des mises à jour, ou en cas de force majeure. StarPulse ne garantit pas un taux de disponibilité spécifique et ne pourra être tenu responsable des interruptions de service.</p>
      </S>

      <S t="8. Propriété intellectuelle">
        <p>L'ensemble des éléments constituant le Service (logiciel, design, textes, algorithmes, bases de données, marque StarPulse) sont la propriété exclusive de StarPulse et sont protégés par les lois applicables en matière de propriété intellectuelle. Toute reproduction, modification ou exploitation non autorisée est interdite.</p>
      </S>

      <S t="9. Programme d'affiliation">
        <p>StarPulse propose un programme d'affiliation permettant aux Utilisateurs de recommander le Service et de percevoir une commission. Les conditions du programme (taux de commission de 20%, durée de 24 mois, modalités de versement) sont détaillées dans la section Affiliation du tableau de bord. StarPulse se réserve le droit de modifier les conditions du programme d'affiliation à tout moment, avec un préavis de 30 jours.</p>
      </S>

      <S t="10. Limitation de responsabilité">
        <p>StarPulse ne pourra en aucun cas être tenu responsable des dommages indirects, accessoires ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser le Service. La responsabilité totale de StarPulse ne pourra excéder le montant des sommes versées par l'Utilisateur au cours des 12 derniers mois.</p>
      </S>

      <S t="11. Modification des CGU">
        <p>StarPulse se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entreront en vigueur dès leur publication sur le Site. L'Utilisateur sera informé par email des modifications substantielles. La poursuite de l'utilisation du Service après notification vaut acceptation des nouvelles CGU.</p>
      </S>

      <S t="12. Droit applicable">
        <p>Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux français.</p>
      </S>

    </LegalLayout>
  )
}
