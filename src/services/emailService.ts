
export const emailService = {
  async submitToWaitlist(email: string, campaignRef: string = 'Nenhum') {
    const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

    if (!GOOGLE_SCRIPT_URL) {
      console.error('Google Script URL not found in environment variables');
      return;
    }

    const browserData = {
      lang: navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.userAgentData?.platform || navigator.platform,
      isBot: navigator.webdriver ? 'Yes' : 'No',
      ref: document.referrer || 'Direto',
      campaign: campaignRef
    };

    const params = new URLSearchParams();
    params.append('email', email);
    params.append('date', new Date().toISOString());
    params.append('browser_lang', browserData.lang);
    params.append('timezone', browserData.tz);
    params.append('platform', browserData.platform);
    params.append('is_bot', browserData.isBot);
    params.append('referrer', browserData.ref);
    params.append('campaign', browserData.campaign);

    return fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });
  }
};
