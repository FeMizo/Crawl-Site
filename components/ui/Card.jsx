import { motion } from "motion/react";

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 22 },
  },
};

export default function Card({
  as: Tag = "section",
  className = "",
  padding = "md",
  animated = false,
  delay = 0,
  children,
  ...props
}) {
  const classes = ["ui-card", `ui-card-${padding}`, className].filter(Boolean).join(" ");

  if (animated) {
    return (
      <motion.section
        className={classes}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: delay / 1000 }}
        {...props}
      >
        {children}
      </motion.section>
    );
  }

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}
