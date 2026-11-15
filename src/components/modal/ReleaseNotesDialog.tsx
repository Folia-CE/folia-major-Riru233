import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetButton } from '../shared/Sheet';
import { openHomeTab } from '../app/home/useFoliumHomeNavigation';
import { NewFeaturesIntro } from './NewFeaturesIntro';
import { NEW_FEATURES_RELEASE } from './newFeaturesRelease';
import { USER_GUIDE_AUTO_OPEN_VERSION } from './userGuideContent';

// src/components/modal/ReleaseNotesDialog.tsx
// The 版本更新 dialog: what the current release brought. Opened from the Help page, and by the app
// shell on the first start of a new release.
// The banner at the top of the notes opens a home tab: that tab is selected first, and the dialog
// closes only if it took (a suite without that tab leaves the notes open).

type ReleaseNotesDialogProps = {
    isOpen: boolean;
    isDaylight: boolean;
    onClose: () => void;
};

const ReleaseNotesDialog: React.FC<ReleaseNotesDialogProps> = ({ isOpen, isDaylight, onClose }) => {
    const { t } = useTranslation();
    const handleOpenTab = useCallback((tab: Parameters<typeof openHomeTab>[0]) => {
        if (openHomeTab(tab)) onClose();
    }, [onClose]);

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            isDaylight={isDaylight}
            size="m"
            title={t('help.releaseNotes')}
            // The release the notes were written for; the label may carry a channel letter.
            subtitle={NEW_FEATURES_RELEASE.displayVersion
                ? `v${NEW_FEATURES_RELEASE.displayVersion}`
                : USER_GUIDE_AUTO_OPEN_VERSION ? `v${USER_GUIDE_AUTO_OPEN_VERSION}` : undefined}
            footer={<SheetButton data-testid="release-notes-close" onClick={onClose}>{t('ui.close')}</SheetButton>}
        >
            <div data-testid="release-notes-dialog">
                <NewFeaturesIntro onOpenTab={handleOpenTab} />
            </div>
        </Sheet>
    );
};

export default ReleaseNotesDialog;
