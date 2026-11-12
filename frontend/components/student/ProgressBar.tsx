interface ProgressBarProps {
  percentage: number;
  height?: string;
}

export default function ProgressBar({ percentage, height = '12px' }: ProgressBarProps) {
  return (
    <div className="bar" style={{ height }}>
      <i style={{ width: `${percentage}%` }}></i>
    </div>
  );
}
