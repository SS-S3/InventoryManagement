import { useState } from "react";
import { Package, Mail, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { BackgroundBeams } from "@/app/components/ui/background-beams";
import { Button } from "@/app/components/ui/button";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

interface LoginProps {
  onLogin: (credentials: { username: string; password: string }) => Promise<void>;
  onGoogleLogin: (token: string) => Promise<void>;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function Login({ onLogin, onGoogleLogin, onSwitchToRegister, onForgotPassword, isSubmitting, error }: LoginProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(formData);
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      await onGoogleLogin(credentialResponse.credential);
    }
  };

  const handleGoogleError = () => {
    console.error("Google Login Failed");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundBeams />

      {/* Gradient orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-block mb-4 bg-neutral-800/60 backdrop-blur-xl rounded-2xl border border-neutral-700 p-4 shadow-2xl"
          >
            <img src="/sr.png" alt="Logo" className="w-40 h-40 object-contain" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
            SR-DTU
          </h1>
          <p className="text-neutral-400 mt-2 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Sign in to access your account
          </p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-neutral-800/60 backdrop-blur-xl rounded-2xl border border-neutral-700 p-8 shadow-2xl"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Username
              </label>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                Password
              </label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-700 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-neutral-400">Remember me</span>
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg shadow-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-neutral-700"></div>
            <span className="mx-4 text-neutral-500 text-sm">OR</span>
            <div className="flex-grow border-t border-neutral-700"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="pill"
              size="large"
              text="continue_with"
              width={320}
            />
          </div>

          {/* Register Link */}
          <div className="mt-6 p-4 bg-blue-950/90 rounded-lg border border-blue-600/90">
            <p className="text-sm text-neutral-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Register here
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}