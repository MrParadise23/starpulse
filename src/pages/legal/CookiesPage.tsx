import LegalLayout from './LegalLayout'

const S = ({ children, t }: { children: React.ReactNode; t: string }) => (
  <section style={{ marginBottom:32 }}>
    <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, color:'#1a1a18', margin:'0 0 12px' }}>{t}</h2>
    {children}
  </section>
)

export default function CookiesPage() {
  return (
    <LegalLayout title="Politique de cookies" lastUpdated="20 mars 2026">

      <S t="1. Qu'est-ce qu'un cookie ?">
        <p>Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone, tablette) lors de la visite d'un site web. Il permet au site de se souvenir de certaines informations pour améliorer votre expérience de navigation.</p>
      </S>

      <S t="2. Cookies utilisés par StarPulse">
        <p><strong>Cookies strictement nécessaires (exemptés de consentement) :</strong></p>
        <p><strong>Session d'authentification Supabase :</strong> permet de maintenir votre connexion au tableau de bord. Durée : durée de la session. Ces cookies sont indispensables au fonctionnement du Service et ne peuvent pas être désactivés.</p>

        <p style={{ marginTop:16 }}><strong>Cookies tiers :</strong></p>
        <p>À ce jour, StarPulse n'utilise <strong>aucun cookie publicitaire, analytique ou de suivi tiers</strong> (pas de Google Analytics, pas de Facebook Pixel, pas de cookies de remarketing). Si cela venait à changer, cette page sera mise à jour et votre consentement sera recueilli préalablement.</p>
      </S>

      <S t="3. Pages de scan client (QR codes et NFC)">
        <p>Les pages de scan destinées aux clients finaux de nos Utilisateurs (pages /t/ et /r/) ne déposent <strong>aucun cookie</strong> sur le terminal du visiteur.</p>
      </S>

      <S t="4. Gérer vos préférences">
        <p>Vous pouvez à tout moment configurer votre navigateur pour accepter, refuser ou supprimer les cookies. Voici les liens vers les pages de gestion des cookies des principaux navigateurs :</p>
        <p>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener" style={{ color:'#2563eb' }}>Google Chrome</a>{' · '}
          <a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noopener" style={{ color:'#2563eb' }}>Firefox</a>{' · '}
          <a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener" style={{ color:'#2563eb' }}>Safari</a>{' · '}
          <a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener" style={{ color:'#2563eb' }}>Microsoft Edge</a>
        </p>
        <p>La désactivation des cookies d'authentification pourra affecter le fonctionnement du tableau de bord StarPulse.</p>
      </S>

      <S t="5. Modifications">
        <p>Cette politique de cookies peut être modifiée à tout moment. Toute modification sera publiée sur cette page avec mise à jour de la date en haut du document.</p>
      </S>

    </LegalLayout>
  )
}
