import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { FileText, Shield, CheckCircle } from "lucide-react";
import { TERMS_OF_SERVICE } from "./terms-of-service";
import { PRIVACY_POLICY } from "./privacy-policy";

interface TermsAndPrivacyModalProps {
  onAccept: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsAndPrivacyModal({ onAccept, isOpen, onOpenChange }: TermsAndPrivacyModalProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleAccept = () => {
    if (acceptedTerms && acceptedPrivacy) {
      onAccept();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <FileText className="w-6 h-6 text-blue-600" />
            Terms of Service & Privacy Policy
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
            Please read and accept our terms and privacy policy to continue with registration.
          </DialogDescription>
        </div>

        <ScrollArea className="flex-1 px-6 py-4 max-h-[60vh]">
          <div className="space-y-8">
            {/* Terms of Service */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Terms of Service</h2>
              </div>

              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed whitespace-pre-line">
                {TERMS_OF_SERVICE}
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Policy</h2>
              </div>

              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed whitespace-pre-line">
                {PRIVACY_POLICY}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="accept-terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="accept-terms" className="text-sm text-gray-700 dark:text-gray-300">
                I have read and agree to the <span className="font-semibold">Terms of Service</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="accept-privacy"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="accept-privacy" className="text-sm text-gray-700 dark:text-gray-300">
                I have read and agree to the <span className="font-semibold">Privacy Policy</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAccept}
                disabled={!acceptedTerms || !acceptedPrivacy}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept & Continue
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}