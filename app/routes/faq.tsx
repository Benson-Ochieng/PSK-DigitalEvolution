import React, { useState } from "react";
import { useLoaderData, Link } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { getAdminUser } from "~/lib/sessions.server";

export function meta() {
  return [
    { title: "FAQS - PetStore Kenya" },
    { name: "description", content: "Frequently Asked Questions about delivery, payment methods, express shipping, operations, and product choices at PetStore Kenya." },
  ];
}

export async function loader({ request }: { request: Request }) {
  let isAdmin = false;
  try {
    const admin = await getAdminUser(request);
    isAdmin = !!admin;
  } catch (e) {
    // Silent
  }

  const { query } = await import("~/db.server");
  const { rows } = await query("SELECT id, question, answer, sort_order FROM faqs ORDER BY sort_order ASC, id ASC");
  return { faqs: rows, isAdmin };
}

export default function FaqPage() {
  const { faqs, isAdmin } = useLoaderData() as {
    faqs: Array<{ id: number; question: string; answer: string; sort_order: number }>;
    isAdmin: boolean;
  };

  const [openId, setOpenId] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <>
      <Navbar />

      <style dangerouslySetInnerHTML={{
        __html: `
        .faq-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem var(--page-pad) 5rem;
          font-family: var(--font-sans);
          backgroundColor: #ffffff;
        }

        .faq-wrapper {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .edit-link-container {
          margin-bottom: 2rem;
          text-align: left;
        }

        .edit-link {
          color: #3182ce;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: color 0.15s ease;
        }

        .edit-link:hover {
          color: #2b6cb0;
          text-decoration: underline;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          border-top: 1px solid #edf2f7;
        }

        .faq-item {
          border-bottom: 1px solid #edf2f7;
          overflow: hidden;
        }

        .faq-question-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: none;
          border: none;
          padding: 1.25rem 0.5rem;
          text-align: left;
          cursor: pointer;
          font-weight: 600;
          font-size: 1.05rem;
          color: #1E5DA7;
          transition: color 0.2s ease, background-color 0.2s ease;
          outline: none;
        }

        .faq-question-btn:hover {
          color: #2b6cb0;
          background-color: #f7fafc;
        }

        .faq-arrow {
          display: inline-block;
          width: 0;
          height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-left: 6px solid #1E5DA7;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .faq-item.open .faq-arrow {
          transform: rotate(90deg);
        }

        .faq-answer-container {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s cubic-bezier(0, 1, 0, 1), padding 0.3s ease;
          padding: 0 0.5rem;
        }

        .faq-item.open .faq-answer-container {
          max-height: 1000px; /* arbitrary large number */
          transition: max-height 0.3s cubic-bezier(1, 0, 1, 0), padding 0.3s ease;
          padding-bottom: 1.25rem;
        }

        .faq-answer-content {
          color: black;
          font-size: 14px;
          line-height: 34px;
        }

        .faq-answer-content p {
          margin: 0 0 1rem 0;
        }

        .faq-answer-content p:last-child {
          margin-bottom: 0;
        }

        .faq-answer-content ul {
          list-style-type: disc !important;
          margin: 0 0 1rem 1.5rem !important;
          padding-left: 0.5rem !important;
        }

        .faq-answer-content ol {
          list-style-type: decimal !important;
          margin: 0 0 1rem 1.5rem !important;
          padding-left: 0.5rem !important;
        }

        .faq-answer-content li {
          margin-bottom: 0.5rem !important;
        }

        .faq-answer-content a {
          color: #3182ce;
          text-decoration: none;
        }

        .faq-answer-content a:hover {
          text-decoration: underline;
        }
      ` }} />

      <div className="faq-page-container">
        <PageHeader title="FAQS" />

        <div className="faq-wrapper">
          {faqs.map(faq => (
            <div
              key={faq.id}
              className={`faq-item ${openId === faq.id ? "open" : ""}`}
            >
              <button
                className="faq-question-btn"
                onClick={() => toggleFaq(faq.id)}
                aria-expanded={openId === faq.id}
              >
                <span className="faq-arrow" />
                <span>{faq.question}</span>
              </button>

              <div className="faq-answer-container">
                <div
                  className="faq-answer-content"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            </div>
          ))}

          {faqs.length === 0 && (
            <div style={{ padding: "3rem 0", textAlign: "center", color: "#718096" }}>
              No FAQs available at the moment.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
