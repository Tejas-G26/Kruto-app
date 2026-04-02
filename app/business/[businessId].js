import { useLocalSearchParams } from "expo-router";
import BussinessFullDetailScreen  from "../../app/pages/BussinessFullDetailScreen"

export default function BusinessPage() {
  const { businessId } = useLocalSearchParams();
  console.log(businessId);

  return <BussinessFullDetailScreen businessId={businessId} />;
}