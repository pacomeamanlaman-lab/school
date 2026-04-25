"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, GraduationCap, Lock, Mail } from "lucide-react";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implementer l'authentification avec Supabase
    setTimeout(() => {
      console.log("Login:", { email, password, rememberMe });
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className={styles.page}>
      <div className={styles.heroPanel}>
        <div className={styles.heroBg}>
          <svg
            viewBox="0 0 720 900"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.heroSvg}
            aria-hidden
          >
            <defs>
              <linearGradient id="loginHeroFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0a2a56" stopOpacity="0" />
                <stop offset="100%" stopColor="#071b36" stopOpacity="0.86" />
              </linearGradient>
              <radialGradient id="loginHeroGlow" cx="50%" cy="35%" r="55%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#071b36" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="720" height="900" fill="#071b36" />
            <rect width="720" height="900" fill="url(#loginHeroGlow)" />
            <circle cx="120" cy="160" r="90" fill="#60a5fa" opacity="0.1" />
            <circle cx="580" cy="220" r="120" fill="#3b82f6" opacity="0.08" />
            <path d="M0 520 Q180 460 360 520 T720 500 L720 900 L0 900 Z" fill="#0f305f" opacity="0.9" />
            <path d="M0 580 Q200 520 400 600 T720 560 L720 900 L0 900 Z" fill="#123e74" opacity="0.8" />
            <rect x="0" y="620" width="720" height="280" fill="#06142b" />
            <rect x="0" y="0" width="720" height="900" fill="url(#loginHeroFade)" />
          </svg>
        </div>

        <div className={styles.heroContent}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandIcon}>
              <GraduationCap size={18} />
            </span>
            <span className={styles.brandText}>SCHOOL MANAGER</span>
          </Link>

          <div className={styles.heroTextBlock}>
            <div className={styles.heroTag}>
              <span className={styles.heroTagLine} />
              Gestion scolaire moderne
            </div>
            <h1 className={styles.heroTitle}>
              Votre ecole
              <br />
              <em>organisee</em>
              <br />
              en un seul espace.
            </h1>
            <p className={styles.heroDesc}>
              Eleves, personnel, notes et absences dans une plateforme fluide, securisee et adaptee a votre etablissement.
            </p>
            <div className={styles.heroStats}>
              <div>
                <div className={styles.heroStatValue}>100%</div>
                <div className={styles.heroStatLabel}>Donnees securisees</div>
              </div>
              <div>
                <div className={styles.heroStatValue}>24/7</div>
                <div className={styles.heroStatLabel}>Acces administrateur</div>
              </div>
              <div>
                <div className={styles.heroStatValue}>∞</div>
                <div className={styles.heroStatLabel}>Eleves et personnel</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formTabWrap}>
            <div className={styles.formTab}>
              Se connecter
              <span />
            </div>
          </div>

          <div className={styles.formHeader}>
            <h2>Bon retour</h2>
            <p>Connectez-vous a votre espace School Manager.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <label className={styles.fieldLabel}>Adresse email</label>
              <div className={styles.inputWrap}>
                <Mail className={styles.inputIcon} size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ecole.com"
                  required
                  disabled={isLoading}
                  className={styles.input}
                />
              </div>
            </div>

            <div>
              <div className={styles.passwordHeader}>
                <label className={styles.fieldLabel}>Mot de passe</label>
                <Link href="#" className={styles.forgotLink}>
                  Mot de passe oublie ?
                </Link>
              </div>
              <div className={styles.inputWrap}>
                <Lock className={styles.inputIcon} size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className={`${styles.input} ${styles.passwordInput}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeBtn}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Se souvenir de moi sur cet appareil</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? (
                <>
                  <svg className={styles.spinner} viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p>
              Besoin d&apos;aide ?{" "}
              <button>Contactez l&apos;administrateur</button>
            </p>
          </div>

          <p className={styles.version}>School Manager v1.0 - MVP</p>
        </div>
      </div>
    </div>
  );
}
