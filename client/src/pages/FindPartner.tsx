import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Search, Star, MapPin, Award, Building2, Loader2, Map as MapIcon, List, Navigation } from "lucide-react";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { GRADE_LABELS } from "@shared/constants";
import PartnerAvatar from "@/components/PartnerAvatar";
import RegionSelect, { SIDO_LIST } from "@/components/RegionSelect";
import { useAuth } from "@/_core/hooks/useAuth";
import { MapView } from "@/components/Map";

const GRADE_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

export default function FindPartner() {
  const [searchRegion, setSearchRegion] = useState("");
  const [regionInitialized, setRegionInitialized] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [addressInput, setAddressInput] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const { isAuthenticated } = useAuth();
  const { data: myQuotes } = trpc.quotes.myQuotes.useQuery(undefined, { enabled: isAuthenticated });

  // 내 마지막 견적의 지역(시/도)으로 초기 필터 설정
  const defaultRegion = useMemo(() => {
    if (!myQuotes || myQuotes.length === 0) return "";
    const lastRegion = myQuotes[myQuotes.length - 1]?.region || "";
    // "서울 광진구" → "서울" 추출
    const sido = SIDO_LIST.find(s => lastRegion === s || lastRegion.startsWith(s + " "));
    return sido || "";
  }, [myQuotes]);

  const { data: partners, isLoading } = trpc.partners.list.useQuery();

  // 첫 로드 시 내 지역으로 자동 필터
  useEffect(() => {
    if (!regionInitialized && defaultRegion) {
      setSearchRegion(defaultRegion);
      setRegionInitialized(true);
    }
  }, [defaultRegion, regionInitialized]);

  const filtered = useMemo(() => {
    if (!partners) return [];
    let result = [...partners];
    if (searchRegion && searchRegion !== "all") {
      result = result.filter((p) =>
        (p.regions as string[] || []).some((r) =>
          r === searchRegion || r.startsWith(searchRegion + " ") || searchRegion.startsWith(r + " ") || searchRegion.startsWith(r)
        )
      );
    }
    if (searchText) {
      result = result.filter((p) =>
        p.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
        (p.shortIntro || "").toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (sortBy === "rating") {
      // 평점 높은순 (리뷰 0건 신규는 3.0 기본점), 같으면 리뷰 많은순
      const score = (p: any) => (!p.reviewCount ? 3.0 : Number(p.avgRating || 0));
      result.sort((a, b) => score(b) - score(a) || (b.reviewCount || 0) - (a.reviewCount || 0));
    }
    else if (sortBy === "reviews") result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    else if (sortBy === "recent") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [partners, searchRegion, searchText, sortBy]);

  // Partners that have coordinates for map display
  const mappablePartners = useMemo(() => {
    return filtered.filter((p) => p.latitude && p.longitude);
  }, [filtered]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];
    if (infoWindowRef.current) infoWindowRef.current.close();
  }, []);

  const addPartnerMarkers = useCallback((map: google.maps.Map) => {
    clearMarkers();
    if (!window.google) return;

    infoWindowRef.current = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    mappablePartners.forEach((partner) => {
      const lat = parseFloat(String(partner.latitude));
      const lng = parseFloat(String(partner.longitude));
      if (isNaN(lat) || isNaN(lng)) return;

      const position = { lat, lng };
      bounds.extend(position);
      hasMarkers = true;

      // Custom marker element
      const markerEl = document.createElement("div");
      markerEl.className = "partner-marker";
      markerEl.innerHTML = `
        <div style="
          background: white;
          border: 2px solid ${GRADE_COLORS[partner.grade || "bronze"]};
          border-radius: 12px;
          padding: 6px 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.15s;
          font-family: 'Pretendard', sans-serif;
        ">
          <div style="
            width: 28px; height: 28px;
            background: ${GRADE_COLORS[partner.grade || "bronze"]}22;
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
          ">🏢</div>
          <span style="font-size: 12px; font-weight: 600; color: #1a1a2e; white-space: nowrap;">${partner.companyName}</span>
        </div>
      `;
      markerEl.addEventListener("mouseenter", () => {
        markerEl.style.transform = "scale(1.08)";
        markerEl.style.zIndex = "999";
      });
      markerEl.addEventListener("mouseleave", () => {
        markerEl.style.transform = "scale(1)";
        markerEl.style.zIndex = "";
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: markerEl,
        title: partner.companyName,
      });

      marker.addListener("click", () => {
        const rating = Number(partner.avgRating || 0).toFixed(1);
        const regions = (partner.regions as string[] || []).join(", ") || "전국";
        const gradeLabel = GRADE_LABELS[partner.grade || "bronze"] || "브론즈";
        infoWindowRef.current!.setContent(`
          <div style="font-family: 'Pretendard', sans-serif; padding: 4px; min-width: 200px;">
            <h3 style="font-size: 15px; font-weight: 700; margin: 0 0 6px; color: #1a1a2e;">${partner.companyName}</h3>
            <p style="font-size: 12px; color: #666; margin: 0 0 8px;">${partner.shortIntro || "환기·닥트 전문 시공업체"}</p>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 13px;">⭐ ${rating}</span>
              <span style="font-size: 12px; color: #888;">리뷰 ${partner.reviewCount || 0}건</span>
              <span style="font-size: 11px; background: ${GRADE_COLORS[partner.grade || "bronze"]}33; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${gradeLabel}</span>
            </div>
            <div style="font-size: 12px; color: #888; margin-bottom: 8px;">📍 ${regions}</div>
            <a href="/partner/${partner.id}" style="
              display: inline-block;
              background: #1a1a2e;
              color: white;
              padding: 6px 14px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 12px;
              font-weight: 600;
            ">상세 보기</a>
          </div>
        `);
        infoWindowRef.current!.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Add user location marker if exists
    if (userLocation) {
      bounds.extend(userLocation);
      const userEl = document.createElement("div");
      userEl.innerHTML = `
        <div style="
          width: 40px; height: 40px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(59,130,246,0.5);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        ">📍</div>
      `;
      if (userMarkerRef.current) userMarkerRef.current.map = null;
      userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: userLocation,
        content: userEl,
        title: "내 위치",
      });
    }

    if (hasMarkers) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [mappablePartners, userLocation, clearMarkers]);

  // When map is ready, add markers
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    addPartnerMarkers(map);
  }, [addPartnerMarkers]);

  // Update markers when filtered partners change
  useEffect(() => {
    if (mapRef.current && viewMode === "map") {
      addPartnerMarkers(mapRef.current);
    }
  }, [mappablePartners, viewMode, addPartnerMarkers]);

  // Search by address - geocode and center map
  const handleAddressSearch = useCallback(async () => {
    if (!addressInput.trim() || !mapRef.current || !window.google) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: addressInput }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        const newLoc = { lat: loc.lat(), lng: loc.lng() };
        setUserLocation(newLoc);
        mapRef.current?.setCenter(newLoc);
        mapRef.current?.setZoom(13);
      }
    });
  }, [addressInput]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">파트너 찾기</h1>
              <p className="text-muted-foreground">지역과 전문 분야를 기준으로 최적의 파트너를 찾아보세요</p>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="gap-1.5"
              >
                <List className="w-4 h-4" />
                목록
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="gap-1.5"
              >
                <MapIcon className="w-4 h-4" />
                지도
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="업체명 또는 키워드 검색"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant={searchRegion ? "outline" : "ghost"}
                size="sm"
                className="text-xs h-9 px-3 shrink-0"
                onClick={() => setSearchRegion("")}
              >
                전체
              </Button>
              <RegionSelect
                value={searchRegion}
                onChange={setSearchRegion}
                label=""
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">평점순</SelectItem>
                <SelectItem value="reviews">리뷰순</SelectItem>
                <SelectItem value="recent">최신순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Map View */}
          {viewMode === "map" && (
            <div className="mb-6">
              {/* Address search for map */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="주소를 입력하여 주변 파트너를 찾아보세요 (예: 서울시 강남구)"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleAddressSearch} className="gap-1.5 shrink-0">
                  <MapPin className="w-4 h-4" />
                  검색
                </Button>
              </div>

              <Card className="border-border/50 shadow-sm overflow-hidden">
                <MapView
                  className="h-[500px] w-full"
                  initialCenter={{ lat: 37.5665, lng: 126.978 }}
                  initialZoom={11}
                  onMapReady={handleMapReady}
                />
              </Card>

              {mappablePartners.length === 0 && !isLoading && (
                <p className="text-center text-sm text-muted-foreground mt-3">
                  지도에 표시할 파트너가 없습니다. 파트너가 주소를 등록하면 지도에 표시됩니다.
                </p>
              )}
              {mappablePartners.length > 0 && (
                <p className="text-sm text-muted-foreground mt-3">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  지도에 {mappablePartners.length}개 파트너가 표시되고 있습니다
                </p>
              )}
            </div>
          )}

          {/* List View */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((partner) => (
                <Link key={partner.id} href={`/partner/${partner.id}`}>
                  <Card className="border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <PartnerAvatar logoUrl={partner.logoUrl} companyName={partner.companyName} size="md" />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{partner.companyName}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{partner.shortIntro || "환기·닥트 전문 시공업체"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{Number(partner.avgRating || 0).toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">리뷰 {partner.reviewCount || 0}건</span>
                        <Badge variant="secondary" className="text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          {GRADE_LABELS[partner.grade || "bronze"]}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">
                          {partner.address || (partner.regions as string[] || []).join(", ") || "전국"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
