import LegalLayout from './LegalLayout'

const S = ({ children, t }: { children: React.ReactNode; t: string }) => (
  <section style={{ marginBottom:32 }}>
    <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, color:'#1a1a18', margin:'0 0 12px' }}>{t}</h2>
    {children}
  </section>
)

export default function CgvPage() {
  return (
    <LegalLayout title="Conditions Générales de Vente" lastUpdated="20 mars 2026">

      <S t="1. Objet">
        <p>Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent les relations contractuelles entre l'éditeur du site star-pulse.com (ci-après « StarPulse ») et toute personne physique ou morale souscrivant un abonnement ou achetant un produit sur le Site (ci-après « le Client »).</p>
        <p>Toute souscription à un abonnement ou achat implique l'acceptation sans réserve des présentes CGV.</p>
      </S>

      <S t="2. Services proposés">
        <p>StarPulse propose une plateforme SaaS (Software as a Service) de gestion de réputation et de collecte d'avis clients pour les commerces physiques. Les services incluent notamment :</p>
        <p>Le smart routing des clients via tags NFC et QR codes, la collecte de retours privés, l'intégration avec Google Business Profile, la génération de réponses IA aux avis, un tableau de bord de suivi des performances et un programme d'affiliation.</p>
      </S>

      <S t="3. Tarifs et modalités de paiement">
        <p><strong>Abonnement mensuel :</strong> 29 EUR TTC par mois et par établissement.</p>
        <p><strong>Abonnement annuel :</strong> 249 EUR TTC par an et par établissement (soit environ 20,75 EUR/mois).</p>
        <p><strong>Tags NFC :</strong> à partir de 24,90 EUR TTC l'unité, avec des tarifs dégressifs par pack (3, 5, 10, 25 tags).</p>
        <p>Les prix sont indiqués en euros, toutes taxes comprises (TTC). StarPulse se réserve le droit de modifier ses tarifs à tout moment. Les nouveaux tarifs s'appliqueront à compter du prochain renouvellement de l'abonnement.</p>
        <p>Le paiement est effectué par carte bancaire via la plateforme sécurisée <strong>Stripe</strong>. Les données bancaires ne sont jamais stockées sur les serveurs de StarPulse.</p>
      </S>

      <S t="4. Essai gratuit">
        <p>StarPulse propose un essai gratuit de 7 jours lors de la première souscription. Pendant cette période, le Client bénéficie de l'ensemble des fonctionnalités du service. À l'issue de la période d'essai, l'abonnement est automatiquement converti en abonnement payant, sauf résiliation avant la fin de l'essai.</p>
      </S>

      <S t="5. Durée et renouvellement">
        <p>L'abonnement mensuel est conclu pour une durée d'un mois, renouvelable tacitement chaque mois. L'abonnement annuel est conclu pour une durée de douze mois, renouvelable tacitement chaque année.</p>
      </S>

      <S t="6. Résiliation">
        <p>Conformément à la loi, le Client peut résilier son abonnement à tout moment depuis son espace client, via le bouton « Gérer la facturation (Stripe) » dans la section Abonnement du tableau de bord. La résiliation prend effet à la fin de la période en cours déjà payée.</p>
        <p>Aucun remboursement au prorata ne sera effectué pour la période en cours, sauf dans le cadre de la garantie satisfait ou remboursé (voir article 8).</p>
      </S>

      <S t="7. Droit de rétractation">
        <p>Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contrats de fourniture de contenu numérique non fourni sur un support matériel dont l'exécution a commencé avec l'accord du consommateur.</p>
        <p>Toutefois, StarPulse propose une garantie commerciale de 30 jours (voir article 8).</p>
        <p>Pour les tags NFC (produits physiques), le Client dispose d'un délai de rétractation de 14 jours à compter de la réception, conformément à l'article L.221-18 du Code de la consommation. Les tags doivent être retournés dans leur état d'origine, non activés et non utilisés.</p>
      </S>

      <S t="8. Garantie satisfait ou remboursé">
        <p>StarPulse offre une garantie commerciale de 30 jours. Si le Client n'est pas satisfait du service dans les 30 premiers jours suivant la souscription, il peut demander un remboursement intégral en contactant contact@star-pulse.com. Cette garantie s'applique uniquement à la première souscription.</p>
      </S>

      <S t="9. Livraison des tags NFC">
        <p>Les tags NFC commandés sont expédiés sous 3 à 5 jours ouvrés vers la France métropolitaine, la Belgique, la Suisse, le Luxembourg et Monaco. Les frais de livraison sont inclus dans le prix affiché. StarPulse ne pourra être tenu responsable des retards de livraison imputables au transporteur.</p>
      </S>

      <S t="10. Responsabilité">
        <p>StarPulse s'engage à mettre en œuvre tous les moyens nécessaires pour assurer la continuité et la qualité du service. StarPulse ne saurait être tenu responsable des interruptions de service dues à des opérations de maintenance, des cas de force majeure, ou des défaillances de fournisseurs tiers (hébergeur, API Google, Stripe, etc.).</p>
        <p>StarPulse ne garantit pas l'augmentation du nombre d'avis Google ou l'amélioration de la note du Client, le service étant un outil de facilitation.</p>
      </S>

      <S t="11. Données personnelles">
        <p>Le traitement des données personnelles est détaillé dans notre <a href="/confidentialite" style={{ color:'#2563eb' }}>Politique de confidentialité</a>.</p>
      </S>

      <S t="12. Propriété intellectuelle">
        <p>Le Client conserve la propriété de ses données (avis, retours clients, informations de son établissement). StarPulse conserve la propriété de la plateforme, de son code source, de ses algorithmes et de son design.</p>
      </S>

      <S t="13. Médiation">
        <p>En cas de litige, le Client peut recourir gratuitement au service de médiation de la consommation. Les coordonnées du médiateur seront communiquées sur demande à contact@star-pulse.com. Le Client peut également déposer sa réclamation sur la plateforme européenne de règlement en ligne des litiges : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener" style={{ color:'#2563eb' }}>https://ec.europa.eu/consumers/odr</a>.</p>
      </S>

      <S t="14. Droit applicable et juridiction compétente">
        <p>Les présentes CGV sont soumises au droit français. En cas de litige non résolu à l'amiable ou par la médiation, les tribunaux français seront seuls compétents.</p>
      </S>

    </LegalLayout>
  )
}
