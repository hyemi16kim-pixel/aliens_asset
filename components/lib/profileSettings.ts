// profileSettings: localStorage 캐시 기반 동기 헬퍼
// API 로드 후 캐시가 채워지면 올바른 값 반환

export const getProfileSettings = () => {
  const myName = localStorage.getItem("alien_my_name") || "나";
  const partnerName = localStorage.getItem("alien_partner_name") || "파트너";
  const myColor = localStorage.getItem("alien_my_color") || "#BFEFE0";
  const partnerColor = localStorage.getItem("alien_partner_color") || "#FFD6E8";

  return {
    myName,
    partnerName,
    ownerNames: [myName, partnerName, "공동"],
    ownerColor: {
      [myName]: myColor,
      [partnerName]: partnerColor,
      "공동": "#F4F0FF",
    },
  };
};

export const mapOwnerName = (owner?: string | null) => {
  return owner || "공동";
};

export const getOwnerColor = (owner?: string | null) => {
  const { ownerColor, myName, partnerName } = getProfileSettings();
  if (!owner) return "#F4F0FF";
  return ownerColor[owner] || "#F4F0FF";
};

/** API 로드 후 localStorage 캐시 업데이트 */
export const cacheProfileSettings = (myName: string, partnerName: string, myColor: string, partnerColor: string) => {
  localStorage.setItem("alien_my_name", myName);
  localStorage.setItem("alien_partner_name", partnerName);
  localStorage.setItem("alien_my_color", myColor);
  localStorage.setItem("alien_partner_color", partnerColor);
};
