export type CacheType = 'traditional' | 'multi' | 'mystery' | 'route';

export interface CacheIconProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  theme?: string;
}