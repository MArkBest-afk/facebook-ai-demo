'use client';

import type { Robot } from '@/lib/types';

type TFunction = (key: string, params?: Record<string, string | number>) => string;

export const getRobotName = (robot: Robot, t: TFunction): string => {
  const formattedId = robot.id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const key = `robot${formattedId}Name`;
  return t(key);
};
  
export const getRobotDescription = (robot: Robot, t: TFunction): string => {
  const formattedId = robot.id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const key = `robot${formattedId}Description`;
  return t(key);
};
