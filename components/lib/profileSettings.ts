export const getProfileSettings = () => {
  const myName = localStorage.getItem("alien_my_name") || "민준";
  const partnerName = localStorage.getItem("alien_partner_name") || "지영";

  const myColor = localStorage.getItem("alien_my_color") || "#BFEFE0";
  const partnerColor =
    localStorage.getItem("alien_partner_color") || "#FFD6E8";

  return {
    myName,
    partnerName,
    ownerNames: [myName, partnerName, "공동"],
    ownerColor: {
      [myName]: myColor,
      [partnerName]: partnerColor,
      공동: "#F4F0FF",
      민준: myColor,
      지영: partnerColor,
    },
  };
};

export const mapOwnerName = (owner?: string | null) => {
  const { myName, partnerName } = getProfileSettings();

  if (owner === "민준") return myName;
  if (owner === "지영") return partnerName;

  return owner || "공동";
};

export const getOwnerColor = (owner?: string | null) => {
  const { ownerColor } = getProfileSettings();
  const mappedName = mapOwnerName(owner);

  return ownerColor[mappedName] || "#F4F0FF";
};