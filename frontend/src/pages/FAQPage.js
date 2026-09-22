import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: 'easeOut' },
  }),
};

const faqData = [
  {
    category: 'General Trading',
    color: '#3B82F6',
    items: [
      {
        q: 'Can I trade on this platform from anywhere in the world?',
        a: 'Absolutely. Our platform is designed for global accessibility, allowing you to trade anytime, anywhere. We offer multi-language support and a user-friendly interface tailored for international users.',
      },
      {
        q: 'How fast are the trades executed?',
        a: 'Extremely fast. Our industry-leading contract engine boasts a minimum processing delay of only 5 milliseconds and handles up to 100,000 orders per second, ensuring your trades are filled at the price you see, without slippage during high-traffic periods.',
      },
      {
        q: 'How long does the KYC verification process take?',
        a: 'Most verifications are completed within minutes. Once your documents are submitted and approved, your account limits are automatically lifted.',
      },
      {
        q: 'What if I run into an issue or have a question while trading?',
        a: 'We pride ourselves on being available when you need us. Our professional customer service team operates 24/7, 365 days a year. You can reach out anytime via live chat or email.',
      },
      {
        q: 'What happens if my internet disconnects while I am in an open trade?',
        a: 'Your open trades remain active on our servers and are not affected by your connection status. Once you reconnect, you will see the current state of all your positions. We recommend using a stable connection for the best experience.',
      },
    ],
  },
  {
    category: 'Legal & Compliance',
    color: '#4F7CFF',
    items: [
      {
        q: 'Is my personal data safe with your platform?',
        a: 'Yes. We use bank-grade 256-bit SSL encryption to protect all user data. We never sell or share your personal information with third parties, and we comply fully with international data protection regulations.',
      },
      {
        q: 'Do you accept users from my country?',
        a: 'We operate in most jurisdictions globally. During registration, you can verify whether your country is supported. We continuously expand our reach while ensuring full regulatory compliance in each region.',
      },
      {
        q: 'How do you comply with global financial regulations?',
        a: 'We maintain strict adherence to AML (Anti-Money Laundering) and KYC (Know Your Customer) standards. Our compliance team continuously monitors regulatory changes to ensure we meet all applicable legal requirements in every jurisdiction we operate.',
      },
    ],
  },
  {
    category: 'General Troubleshooting',
    color: '#2563EB',
    items: [
      {
        q: "I didn't receive the confirmation email. What should I do?",
        a: 'Please check your spam or junk folder first. If it is not there, try requesting a new confirmation email from the login page. If the issue persists, contact our 24/7 support team and we will resolve it immediately.',
      },
      {
        q: 'Why is my withdrawal pending for a long time?',
        a: 'Withdrawals are typically processed within 24 hours. Delays can occur due to additional security checks, network congestion, or bank processing times. You can check the status in your Funds page. If it has been over 48 hours, please contact support.',
      },
      {
        q: 'What should I do if I sent funds to the wrong network?',
        a: 'Always double-check the network before withdrawing! If you send funds to an unsupported network, we may be able to recover them in some cases, but it is a complex process and not always guaranteed. Please contact support immediately with the transaction hash for assistance.',
      },
    ],
  },
];

const FAQPage = () => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  let globalIndex = 0;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0D1117 0%, #0F172A 100%)',
        pb: 12,
        pt: 4,
      }}
    >
      <Container maxWidth="md">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#F8FAFC',
                mb: 1.5,
                letterSpacing: '-0.02em',
              }}
            >
              Frequently Asked Questions
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 500, mx: 'auto' }}>
              Find quick answers to common questions about trading, compliance, and troubleshooting.
            </Typography>
          </Box>
        </motion.div>

        {/* FAQ Categories */}
        {faqData.map((section) => (
          <Box key={section.category} sx={{ mb: 5 }}>

            {/* Category Label */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={globalIndex++}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: section.color,
                  mb: 2,
                  fontSize: '1rem',
                  letterSpacing: '0.01em',
                }}
              >
                {section.category}
              </Typography>
            </motion.div>

            {/* Accordion Items */}
            {section.items.map((item, i) => {
              const panelId = `${section.category}-${i}`;
              const idx = globalIndex++;
              return (
                <motion.div
                  key={panelId}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={idx}
                >
                  <Accordion
                    expanded={expanded === panelId}
                    onChange={handleChange(panelId)}
                    disableGutters
                    elevation={0}
                    sx={{
                      mb: 1.5,
                      background: 'rgba(255,255,255,0.03)',
                      border: expanded === panelId
                        ? `1px solid ${section.color}55`
                        : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '10px !important',
                      '&:before': { display: 'none' },
                      transition: 'border-color 0.3s, box-shadow 0.3s',
                      boxShadow: expanded === panelId
                        ? `0 4px 24px ${section.color}22`
                        : 'none',
                      '&:hover': {
                        border: `1px solid ${section.color}44`,
                        background: 'rgba(255,255,255,0.05)',
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={
                        <ExpandMore
                          sx={{
                            color: expanded === panelId ? section.color : '#64748B',
                            transition: 'color 0.3s',
                          }}
                        />
                      }
                      sx={{
                        px: 2.5,
                        py: 0.5,
                        minHeight: 56,
                        '& .MuiAccordionSummary-content': { my: 1.5 },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: expanded === panelId ? '#F8FAFC' : '#CBD5E1',
                          fontSize: { xs: '0.875rem', sm: '0.95rem' },
                          transition: 'color 0.3s',
                          pr: 2,
                        }}
                      >
                        {item.q}
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails
                      sx={{
                        px: 2.5,
                        pt: 0,
                        pb: 2.5,
                        borderTop: `1px solid rgba(255,255,255,0.05)`,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#94A3B8',
                          lineHeight: 1.75,
                          fontSize: { xs: '0.82rem', sm: '0.875rem' },
                        }}
                      >
                        {item.a}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </motion.div>
              );
            })}
          </Box>
        ))}

      </Container>
    </Box>
  );
};

export default FAQPage;
