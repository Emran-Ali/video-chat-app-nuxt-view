import { ref } from "vue";

export const useConfirmationDialog = () => {
    const confirmDialogRef = ref();

    const confirm = (options: {
        header: string;
        message: string;
        onAccept?: () => void;
        onReject?: () => void;
        acceptToast?: {
            severity?: string;
            summary?: string;
            detail?: string;
            life?: number;
        };
        rejectToast?: {
            severity?: string;
            summary?: string;
            detail?: string;
            life?: number;
        };
        type?: "danger" | "warning" | "success" | "default";
    }) => {
        confirmDialogRef.value?.showConfirmation(options);
    };

    return {
        confirmDialogRef,
        confirm,
    };
};
