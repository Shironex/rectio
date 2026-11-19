import { ANNOUNCEMENT, STORAGE } from '@/data/site';

/**
 * Runs before the first paint, from the layout: applies the remembered theme and mode, and hides an
 * announcement the visitor already dismissed, so nothing flashes or jumps on load.
 */
export const BOOT_SCRIPT = `try{var s=localStorage,r=document.documentElement,c=JSON.parse(s.getItem('${STORAGE.theme}')||'{}');if(c.theme==='ledger'||c.theme==='default')r.dataset.theme=c.theme;if(c.mode==='light'||c.mode==='dark')r.dataset.mode=c.mode;if(s.getItem('${STORAGE.announcement}')==='${ANNOUNCEMENT.id}')r.dataset.announcement='dismissed'}catch(e){}`;
