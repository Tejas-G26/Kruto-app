import { useLocalSearchParams } from "expo-router";
import BussinessFullDetailScreen  from "../../app/pages/BussinessFullDetailScreen"

export default function BusinessPage() {
  const { business_id } = useLocalSearchParams();

  return <BussinessFullDetailScreen business_id={business_id} />;
}