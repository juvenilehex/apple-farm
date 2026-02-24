import { varieties } from '@/data/varieties';
import VarietyDetailPage from './VarietyDetail';

export function generateStaticParams() {
  return varieties.map((v) => ({ id: v.id }));
}

export default function Page() {
  return <VarietyDetailPage />;
}
