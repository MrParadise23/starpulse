import LegalLayout from './LegalLayout'

const S = ({ children, t }: { children: React.ReactNode; t: string }) => (
  <section style={{ marginBottom:32 }}>
    <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, color:'#1a1a18', margin:'0 0 12px' }}>{t}</h2>
    {children}
  </section>
)

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" lastUpdated="20 mars 2026">

      <p style={{ marginBottom:24 }}>StarPulse s'engage à protéger la vie privée de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés. La présente politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos données personnelles.</p>

      <S t="1. Responsable du traitement">
        <p><strong>Louis Rocca Serra EI</strong> (Entrepreneur individuel, micro-entreprise)<br/>SIRET : 92872729600016<br/>17 Quai Comparetti, 20169 Bonifacio, France</p>
        <p>Email de contact pour les questions relatives aux données : <strong>contact@star-pulse.com</strong></p>
      </S>

      <S t="2. Données collectées">
        <p><strong>Données des Utilisateurs (commerçants) :</strong></p>
        <p>Lors de l'inscription : nom, prénom, adresse email, mot de passe (chiffré). Lors de la configuration : nom de l'établissement, adresse, ville, catégorie, logo, lien Google, préférences IA. Lors du paiement : les données bancaires sont traitées exclusivement par Stripe et ne sont jamais stockées sur nos serveurs. Programme d'affiliation : IBAN (pour le versement des commissions).</p>

        <p style={{ marginTop:16 }}><strong>Données des Clients finaux (consommateurs) :</strong></p>
        <p>Lors d'un scan NFC ou QR : note attribuée, type de support scanné, horodatage. Lors d'un retour privé (facultatif) : prénom, email, téléphone, commentaire. Aucun cookie n'est déposé sur les pages de scan client.</p>
      </S>

      <S t="3. Finalités et bases légales du traitement">
        <p><strong>Exécution du contrat (article 6.1.b RGPD) :</strong> gestion du compte utilisateur, fourniture du service de smart routing, génération de réponses IA, gestion des abonnements et de la facturation, programme d'affiliation.</p>
        <p><strong>Intérêt légitime (article 6.1.f RGPD) :</strong> amélioration du Service, statistiques agrégées d'utilisation, prévention de la fraude, support client.</p>
        <p><strong>Consentement (article 6.1.a RGPD) :</strong> envoi de communications marketing (le cas échéant), dépôt de cookies non essentiels.</p>
        <p><strong>Obligation légale (article 6.1.c RGPD) :</strong> conservation des données de facturation conformément aux obligations comptables et fiscales.</p>
      </S>

      <S t="4. Sous-traitants et destinataires">
        <p>StarPulse fait appel aux sous-traitants suivants pour le fonctionnement du Service :</p>
        <p><strong>Supabase Inc.</strong> (Singapour / États-Unis) : hébergement de la base de données et des fonctions serveur. <strong>Vercel Inc.</strong> (États-Unis) : hébergement du site web et de l'application. <strong>Stripe Inc.</strong> (États-Unis) : traitement des paiements par carte bancaire. <strong>OpenAI Inc.</strong> (États-Unis) : génération de réponses IA aux avis clients. <strong>Squarespace Inc.</strong> (États-Unis) : gestion du nom de domaine.</p>
        <p>Ces sous-traitants sont soumis au RGPD ou à des mécanismes de transfert adéquats (clauses contractuelles types, Privacy Shield, etc.).</p>
        <p>Vos données ne sont jamais vendues, louées ou cédées à des tiers à des fins commerciales.</p>
      </S>

      <S t="5. Durée de conservation">
        <p><strong>Données de compte :</strong> conservées pendant toute la durée de l'abonnement, puis 3 ans après la résiliation (pour permettre une éventuelle réactivation et répondre aux obligations légales).</p>
        <p><strong>Données de facturation :</strong> conservées 10 ans conformément aux obligations comptables françaises.</p>
        <p><strong>Retours privés des clients finaux :</strong> conservés 24 mois après leur création, sauf suppression manuelle par l'Utilisateur.</p>
        <p><strong>Données de scan :</strong> conservées 24 mois à des fins statistiques, puis anonymisées.</p>
      </S>

      <S t="6. Vos droits">
        <p>Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :</p>
        <p><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles. <strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes. <strong>Droit d'effacement :</strong> demander la suppression de vos données (sous réserve de nos obligations légales de conservation). <strong>Droit à la limitation :</strong> restreindre le traitement de vos données dans certains cas. <strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible. <strong>Droit d'opposition :</strong> vous opposer au traitement de vos données fondé sur l'intérêt légitime.</p>
        <p>Pour exercer ces droits, contactez-nous à <strong>contact@star-pulse.com</strong>. Nous répondrons dans un délai maximum de 30 jours.</p>
        <p>Vous avez également le droit d'introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener" style={{ color:'#2563eb' }}>www.cnil.fr</a>.</p>
      </S>

      <S t="7. Sécurité des données">
        <p>StarPulse met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement des données en transit (TLS/SSL), chiffrement des mots de passe (bcrypt via Supabase Auth), accès restreint aux bases de données via des politiques de sécurité (Row Level Security), sauvegardes régulières, surveillance continue de l'infrastructure.</p>
      </S>

      <S t="8. Transferts internationaux">
        <p>Certains de nos sous-traitants sont situés aux États-Unis. Les transferts de données vers ces pays sont encadrés par des clauses contractuelles types approuvées par la Commission européenne, conformément à l'article 46 du RGPD.</p>
      </S>

      <S t="9. Modifications">
        <p>La présente politique peut être modifiée à tout moment. En cas de modification substantielle, les Utilisateurs seront informés par email ou via une notification dans le tableau de bord. La date de dernière mise à jour est indiquée en haut de cette page.</p>
      </S>

    </LegalLayout>
  )
}
