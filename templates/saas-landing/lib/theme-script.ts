import { ANNOUNCEMENT, STORAGE } from '@/data/site';

/**
 * Runs before the first paint, from the layout: applies the remembered colour mode, and hides an
 * announcement the visitor already dismissed, and marks a visitor who already made a cookie choice,
 * so nothing flashes or jumps on load.
 */
export const BOOT_SCRIPT = `try{var s=localStorage,r=document.documentElement,c=JSON.parse(s.getItem('${STORAGE.theme}')||'{}');if(c.mode==='light'||c.mode==='dark')r.dataset.mode=c.mode;if(s.getItem('${STORAGE.announcement}')==='${ANNOUNCEMENT.id}')r.dataset.announcement='dismissed';if(s.getItem('${STORAGE.consent}'))r.classList.add('consent-decided')}catch(e){}`;
