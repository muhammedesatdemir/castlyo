/**
 * Tek kaynaklı yönlendirme URL'leri
 * Hamburger menüde çalışan URL'ler burada tanımlanır
 */

export const ROUTES = {
  // Yetenek onboarding akışı (doğrudan onboarding sayfası)
  talent: {
    pathname: "/onboarding/talent",
  },
  
  // Ajans onboarding akışı (doğrudan onboarding sayfası)
  agency: {
    pathname: "/onboarding/agency",
  }
} as const;

/**
 * Next.js Link component'i için href objesi oluşturur
 */
export const getTalentHref = () => ({
  pathname: ROUTES.talent.pathname,
});

export const getAgencyHref = () => ({
  pathname: ROUTES.agency.pathname,
});

/**
 * Next.js router.push için URL string oluşturur
 */
export const getTalentUrl = () => ROUTES.talent.pathname;

export const getAgencyUrl = () => ROUTES.agency.pathname;
