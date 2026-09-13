import { getAllGuides } from 'backend/guides.jsw';

$w.onReady(async function () {
    try {
        const guides = await getAllGuides();

        $w('#guidesList').postMessage({
            type: 'GUIDES_UPDATE',
            payload: { items: guides }
        });
    } catch (error) {
        console.error('[GuidesAll] load error:', error);
    }
});
