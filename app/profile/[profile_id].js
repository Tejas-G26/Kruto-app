import { useLocalSearchParams } from "expo-router";
import ProfileScreen from "../../app/pages/ProfileScreen"

export default function BusinessPage() {
  const { profile_id } = useLocalSearchParams();

  return <ProfileScreen profile_id={profile_id} />;
}