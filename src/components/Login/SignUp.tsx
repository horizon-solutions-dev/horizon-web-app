import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack } from "react-icons/io";
import "./sign-up.scss";
import { AccountService } from "../../services/accountService";
import type { CreateAccountRequest } from "../../models/api.model";

interface SignUpProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function SignUp({ onBack, onSuccess }: SignUpProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string()
      .min(3, t("validation.nameTooShort") || "Mínimo 3 caracteres")
      .required(t("validation.nameRequired") || "Nome é obrigatório"),
    
    surname: Yup.string()
      .min(3, t("validation.surnameTooShort") || "Mínimo 3 caracteres")
      .required(t("validation.surnameRequired") || "Sobrenome é obrigatório"),
    
    email: Yup.string()
      .email(t("validation.emailInvalid"))
      .required(t("validation.emailRequired")),
    
    phone: Yup.string()
      .matches(/^\+?55\d{10,11}$/, t("validation.invalidPhone") || "Telefone inválido (ex: +5511999999999)")
      .required(t("validation.phoneRequired") || "Telefone é obrigatório"),
    
    docType: Yup.string()
      .oneOf(["CPF", "CNPJ", "PASS"], "Tipo de documento inválido")
      .required(t("validation.docTypeRequired") || "Tipo de documento é obrigatório"),
    
    doc: Yup.string()
      .required(t("validation.docRequired") || "Documento é obrigatório")
      .test("valid-doc", t("validation.invalidDoc") || "Documento inválido", function (value) {
        const { docType } = this.parent;
        if (!value) return false;
        
        const cleanDoc = value.replace(/\D/g, "");
        
        if (docType === "CPF") {
          return cleanDoc.length === 11;
        } else if (docType === "CNPJ") {
          return cleanDoc.length === 14;
        } else if (docType === "PASS") {
          return cleanDoc.length >= 5;
        }
        
        return false;
      }),
    
    password: Yup.string()
      .min(8, t("validation.passwordMinLength") || "Mínimo 8 caracteres")
      .matches(/[A-Z]/, t("validation.passwordUppercase") || "Deve conter letra maiúscula")
      .matches(/[a-z]/, t("validation.passwordLowercase") || "Deve conter letra minúscula")
      .matches(/[0-9]/, t("validation.passwordNumber") || "Deve conter número")
      .matches(/[!@#$%^&*]/, t("validation.passwordSpecial") || "Deve conter caractere especial (!@#$%^&*)")
      .required(t("validation.passwordRequired")),
    
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], t("validation.passwordMatch") || "As senhas não conferem")
      .required(t("validation.confirmPasswordRequired") || "Confirmação de senha é obrigatória"),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      surname: "",
      email: "",
      phone: "",
      docType: "CPF",
      doc: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);

      try {
        const payload: CreateAccountRequest = {
          name: values.name,
          surname: values.surname,
          email: values.email,
          phone: values.phone,
          docType: values.docType as "CPF" | "CNPJ" | "PASS",
          doc: values.doc.replace(/\D/g, ""),
        };

        await AccountService.createAccount(payload);

        toast.success(t("toast.accountCreated") || "Conta criada com sucesso! Você será redirecionado para o login.");
        
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : (t("toast.error") || "Erro ao criar conta")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleKeyPress = (e: React.KeyboardEvent, handler?: () => void) => {
    if (e.key === "Enter" && handler) {
      e.preventDefault();
      handler();
    }
  };

  const handlePhoneChange = (value: string) => {
    let cleaned = value.replace(/\D/g, "");
    
    if (cleaned.length > 0 && cleaned.charAt(0) !== "5") {
      cleaned = "55" + cleaned;
    }
    
    if (cleaned.length > 13) {
      cleaned = cleaned.slice(0, 13);
    }
    
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = "+" + cleaned;
    }
    
    formik.setFieldValue("phone", formatted);
  };

  const handleDocumentChange = (value: string) => {
    let cleaned = value.replace(/\D/g, "");
    const maxLength = formik.values.docType === "CNPJ" ? 14 : formik.values.docType === "CPF" ? 11 : 20;
    
    if (cleaned.length > maxLength) {
      cleaned = cleaned.slice(0, maxLength);
    }
    
    formik.setFieldValue("doc", cleaned);
  };

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        <div className="signup-card">
          <button
            onClick={onBack}
            className="back-indicator"
            disabled={isSubmitting}
            type="button"
          >
            <IoIosArrowBack />
            <span>{t("login.back") || "Voltar"}</span>
          </button>

          <div className="logo-section">
            <div className="logo">
              <img src="/src/assets/logo.svg" alt="Logo" />
            </div>
          </div>

          <h1 className="title">{t("signup.title") || "Criar Conta"}</h1>
          <p className="subtitle-text">
            {t("signup.description") || "Preencha os dados abaixo para criar sua conta"}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              formik.handleSubmit();
            }}
          >
            <div className="form-row">
              <div className="form-group">
                <label>{t("signup.name") || "Nome"}</label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Digite seu nome"
                  className={`input-field ${
                    formik.touched.name && formik.errors.name ? "input-error" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {formik.touched.name && formik.errors.name && (
                  <div className="error-message">{formik.errors.name}</div>
                )}
              </div>

              <div className="form-group">
                <label>{t("signup.surname") || "Sobrenome"}</label>
                <input
                  type="text"
                  name="surname"
                  value={formik.values.surname}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Digite seu sobrenome"
                  className={`input-field ${
                    formik.touched.surname && formik.errors.surname ? "input-error" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {formik.touched.surname && formik.errors.surname && (
                  <div className="error-message">{formik.errors.surname}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t("signup.email") || "E-mail"}</label>
                <input
                  type="email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="seu@email.com"
                  className={`input-field ${
                    formik.touched.email && formik.errors.email ? "input-error" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {formik.touched.email && formik.errors.email && (
                  <div className="error-message">{formik.errors.email}</div>
                )}
              </div>

              <div className="form-group">
                <label>{t("signup.phone") || "Telefone"}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formik.values.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={formik.handleBlur}
                  placeholder="+5511999999999"
                  className={`input-field ${
                    formik.touched.phone && formik.errors.phone ? "input-error" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <div className="error-message">{formik.errors.phone}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t("signup.docType") || "Tipo de Documento"}</label>
                <select
                  name="docType"
                  value={formik.values.docType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="input-field"
                  disabled={isSubmitting}
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="PASS">Passaporte</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t("signup.doc") || "Documento"}</label>
                <input
                  type="text"
                  name="doc"
                  value={formik.values.doc}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  onBlur={formik.handleBlur}
                  placeholder={formik.values.docType === "CNPJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                  className={`input-field ${
                    formik.touched.doc && formik.errors.doc ? "input-error" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {formik.touched.doc && formik.errors.doc && (
                  <div className="error-message">{formik.errors.doc}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t("signup.password") || "Senha"}</label>
                <input
                  type="password"
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Digite sua senha"
                  className={`input-field ${
                    formik.touched.password && formik.errors.password ? "input-error" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {formik.touched.password && formik.errors.password && (
                  <div className="error-message">{formik.errors.password}</div>
                )}
              </div>

              <div className="form-group">
                <label>{t("signup.confirmPassword") || "Confirmar Senha"}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Confirme sua senha"
                  className={`input-field ${
                    formik.touched.confirmPassword && formik.errors.confirmPassword ? "input-error" : ""
                  }`}
                  onKeyPress={(e) => handleKeyPress(e, () => formik.handleSubmit())}
                  disabled={isSubmitting}
                />
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <div className="error-message">{formik.errors.confirmPassword}</div>
                )}
              </div>
            </div>

            <div className="button-container">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t("signup.creating") || "Criando conta..."
                  : t("signup.createAccount") || "Criar Conta"}
              </button>
            </div>
          </form>

          <div className="password-requirements">
            <p className="requirements-title">
              {t("signup.passwordRequirements") || "Requisitos de senha:"}
            </p>
            <ul>
              <li>{t("signup.minChars") || "Mínimo 8 caracteres"}</li>
              <li>{t("signup.uppercase") || "Uma letra maiúscula"}</li>
              <li>{t("signup.lowercase") || "Uma letra minúscula"}</li>
              <li>{t("signup.number") || "Um número"}</li>
              <li>{t("signup.special") || "Um caractere especial (!@#$%^&*)"}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}