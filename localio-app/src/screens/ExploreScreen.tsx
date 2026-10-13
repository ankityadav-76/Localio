import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { searchListings } from "../lib/api";
import { colors } from "../theme";
import type { Category } from "../types";
import { AppHeader } from "../components/navigation/AppHeader";
import { PlaceCard } from "../components/places/PlaceCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorNote, Loading } from "../components/ui/Loading";
import { Pill } from "../components/ui/Pill";
import { Screen } from "../components/ui/Screen";
import { T } from "../components/ui/Text";

const CATEGORIES: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "street_food", label: "Street Food" },
  { key: "eatery", label: "Meals" },
];
const SORTS = [
  { key: "trending", label: "Trending" },
  { key: "hidden", label: "Hidden gems" },
  { key: "highest", label: "Highly rated" },
  { key: "most_reviewed", label: "Most reviewed" },
  { key: "recent", label: "Recently discovered" },
] as const;

export default function ExploreScreen() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["key"]>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("trending");
  const q = useQuery({ queryKey: ["listings"], queryFn: () => searchListings({ sort: "rating" }) });

  const visible = useMemo(() => {
    const list = (q.data ?? []).filter((l) => category === "all" || l.category === category);
    const hiddenScore = (l: { review_count: number; bayesian_avg: number }) => (l.review_count > 0 && l.review_count <= 3 ? l.bayesian_avg : -1);
    switch (sort) {
      case "trending":
      case "most_reviewed":
        return [...list].sort((a, b) => b.review_count - a.review_count);
      case "hidden":
        return [...list].sort((a, b) => hiddenScore(b) - hiddenScore(a));
      case "highest":
        return [...list].sort((a, b) => b.bayesian_avg - a.bayesian_avg);
      case "recent":
        return [...list].sort((a, b) => b.id - a.id);
    }
  }, [q.data, category, sort]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <AppHeader />
      <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching} contentStyle={{ paddingTop: 20 }}>
        <T variant="display" style={{ fontSize: 26 }}>Explore</T>
        <T variant="small" style={{ marginBottom: 14 }}>Browse the neighborhood's local culture.</T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
          {CATEGORIES.map((c) => <Pill key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
          {SORTS.map((s) => <Pill key={s.key} label={s.label} active={sort === s.key} onPress={() => setSort(s.key)} />)}
        </ScrollView>
        {q.isLoading && <Loading />}
        {q.isError && <ErrorNote message={(q.error as Error).message} />}
        {q.data && visible.length === 0 && <EmptyState title="Nothing here yet" subtitle="Try a different category." />}
        <View style={{ gap: 12 }}>{visible.map((l) => <PlaceCard key={l.id} listing={l} fill />)}</View>
      </Screen>
    </View>
  );
}
