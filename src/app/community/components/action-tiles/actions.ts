/**
 * Action definitions for bulletin board tiles
 */

import type { LucideIcon } from "lucide-react";
import { UtensilsCrossed, HandHeart, Car, Heart } from "lucide-react";

export type Action = {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  iconComponent?: LucideIcon;
  color: "yellow" | "pink" | "blue" | "green";
  pinColor: "red" | "blue" | "yellow" | "green";
  href?: string;
  onClick?: () => void;
  intent: "need" | "share" | "volunteer" | "other";
};

export const ACTIONS: Action[] = [
  {
    id: "need-help",
    title: "I need help",
    description: "Ask for food, rides, or support",
    icon: "🍽️",
    iconComponent: UtensilsCrossed,
    color: "yellow",
    pinColor: "red",
    intent: "need",
  },
  {
    id: "offer-meal",
    title: "I can offer",
    description: "Share meals or resources",
    icon: "🤝",
    iconComponent: HandHeart,
    color: "green",
    pinColor: "green",
    intent: "share",
  },
  {
    id: "share-ride",
    title: "Share a ride",
    description: "Offer or request transportation",
    icon: "🚗",
    iconComponent: Car,
    color: "blue",
    pinColor: "blue",
    intent: "other",
  },
  {
    id: "volunteer",
    title: "Volunteer",
    description: "Offer your time and skills",
    icon: "❤️",
    iconComponent: Heart,
    color: "pink",
    pinColor: "yellow",
    intent: "volunteer",
  },
];
