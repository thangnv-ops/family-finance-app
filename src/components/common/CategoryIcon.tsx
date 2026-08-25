import React from 'react';
import {
  User,
  Heart,
  Coffee,
  Car,
  ShoppingBag,
  ShoppingCart,
  Home,
  Zap,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Navigation,
  MapPin,
  Baby,
  MoreHorizontal,
  Briefcase,
  Award,
  Gift,
  Coins,
  DollarSign,
  ArrowRightLeft,
  CreditCard,
  PiggyBank,
  HandCoins,
  Shield,
  Plane,
  HeartPulse,
  Tag,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  User,
  Heart,
  Coffee,
  Car,
  ShoppingBag,
  ShoppingCart,
  Home,
  Zap,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Navigation,
  MapPin,
  Baby,
  MoreHorizontal,
  Briefcase,
  Award,
  Gift,
  Coins,
  DollarSign,
  ArrowRightLeft,
  CreditCard,
  PiggyBank,
  HandCoins,
  Shield,
  Plane,
  HeartPulse,
  Tag,
};

interface CategoryIconProps {
  iconName?: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName = 'Tag',
  className = 'w-4 h-4',
  color,
}) => {
  const IconComponent = (iconName && ICON_MAP[iconName]) || Tag;
  return (
    <IconComponent
      className={className}
      style={color ? { color } : undefined}
    />
  );
};
