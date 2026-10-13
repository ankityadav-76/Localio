import { useState } from "react";
import { TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { searchListings } from "../lib/api";
import { colors, fonts, radius } from "../theme";
import { PlaceCard } from "../components/places/PlaceCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorNote, Loading } from "../components/ui/Loading";
import { Screen } from "../components/ui/Screen";
import { T } from "../components/ui/Text";

export default function SearchScreen() {
  const { q: initial } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(initial ?? "");
  const all = useQuery({ queryKey: ["listings"], queryFn: () => searchListings({ sort: "rating" }) });

  // Backend only text-matches locality today; match name/locality/landmark here
  // until there's real search (fine at prototype scale).
  const needle = query.trim().toLowerCase();
  const results = needle
    ? (all.data ?? []).filter(
        (l) =>
          l.name.toLowerCase().includes(needle) ||
          l.locality.toLowerCase().includes(needle) ||
          (l.landmark ?? "").toLowerCase().includes(needle) ||
          (l.category === "street_food" && "street food".includes(needle))
      )
    : [];

  return (
    <Screen contentStyle={{ paddingTop: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, backgroundColor: colors.surface, marginBottom: 16 }}>
        <Feather name="search" size={16} color={colors.inkFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder="vada pav, Manek Chowk, best chai..."
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel="Search"
          style={{ flex: 1, paddingVertical: 11, fontFamily: fonts.body, fontSize: 14, color: colors.ink }}
        />
      </View>
      {all.isLoading && <Loading />}
      {all.isError && <ErrorNote message={(all.error as Error).message} />}
      {!needle && !all.isLoading && <T variant="small">Search for a place, dish, locality, or landmark.</T>}
      {needle && all.data && results.length === 0 && <EmptyState title="No matches" subtitle={`Nothing found for "${query}" yet.`} />}
      <View style={{ gap: 12 }}>{results.map((l) => <PlaceCard key={l.id} listing={l} fill />)}</View>
    </Screen>
  );
}
