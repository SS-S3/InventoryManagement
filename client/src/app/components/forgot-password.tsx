import { useState } from "react";
import { ArrowLeft, Lock, CheckCircle, Loader2, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { BackgroundBeams } from "@/app/components/ui/background-beams";
import { Button } from "@/app/components/ui/button";

type Step = "google" | "newPassword" | "success";

interface ForgotPasswordProps {
  onBack: () => void;
  apiBase: string;
}

export function ForgotPassword({ onBack, apiBase }: ForgotPasswordProps) {
  const [step, setStep] = useState<Step>("google");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBase}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleIdToken: credentialResponse.credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify identity");
      }

      // Extract email from the JWT for display (decode without verification - backend already verified)
      if (credentialResponse.credential) {
        try {
          const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
          setVerifiedEmail(payload.email);
        } catch {
          setVerifiedEmail(null);
        }
      }

      setResetToken(data.resetToken);
      setStep("newPassword");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify identity");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in failed. Please try again.");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${apiBase}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "google":
        return (
          <motion.div
            key="google"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <p className="text-neutral-400 text-sm">
              Sign in with the Google account linked to your registered email to verify your identity.
            </p>

            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6 w-full flex flex-col items-center gap-4">
                <Mail className="w-12 h-12 text-blue-400" />
                <p className="text-neutral-300 text-sm text-center">
                  We'll verify your identity using Google, then let you set a new password.
                </p>
                
                {isLoading ? (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                  />
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
          </motion.div>
        );

      case "newPassword":
        return (
          <motion.form
            key="newPassword"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleResetPassword}
            className="space-y-5"
          >
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              <CheckCircle className="inline w-4 h-4 mr-2" />
              Identity verified{verifiedEmail ? ` for ${verifiedEmail}` : ""}. Enter your new password.
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                New Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                Confirm Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin inline" /> Resetting...</>
              ) : (
                "Reset Password"
              )}
            </Button>
          </motion.form>
        );

      case "success":
        return (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Password Reset!</h3>
            <p className="text-neutral-400 text-sm">
              Your password has been successfully changed. You can now log in with your new password.
            </p>
            <Button
              onClick={onBack}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg shadow-blue-500/25"
            >
              Back to Login
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-neutral-950 overflow-hidden">
      <BackgroundBeams className="absolute inset-0" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            {step !== "success" && (
              <button
                onClick={step === "google" ? onBack : () => setStep("google")}
                className="p-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">
                {step === "success" ? "Success!" : "Reset Password"}
              </h2>
              {step === "google" && (
                <p className="text-neutral-500 text-sm mt-1">Verify with Google</p>
              )}
              {step === "newPassword" && (
                <p className="text-neutral-500 text-sm mt-1">Set new password</p>
              )}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
