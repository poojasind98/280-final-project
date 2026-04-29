import classNames from "classnames";
import styles from "./skeleton.module.scss";

type SkeletonPulseProps = {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "sm" | "md" | "full";
};

/**
 * Accessible skeleton pulse — parent should set `aria-busy` + `aria-live` when
 * wrapping loading regions.
 */
export function SkeletonPulse({
  className,
  width,
  height,
  rounded = "md",
}: SkeletonPulseProps) {
  return (
    <span
      className={classNames(
        styles.pulse,
        styles[`rounded-${rounded}`],
        className,
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
