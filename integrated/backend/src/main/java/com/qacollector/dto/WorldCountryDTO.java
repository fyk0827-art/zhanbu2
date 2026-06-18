package com.qacollector.dto;

public class WorldCountryDTO {
    private String code;
    private String nameZh;
    private String nameEn;

    public WorldCountryDTO(String code, String nameZh, String nameEn) {
        this.code = code;
        this.nameZh = nameZh;
        this.nameEn = nameEn;
    }

    public String getCode() { return code; }
    public String getNameZh() { return nameZh; }
    public String getNameEn() { return nameEn; }
}
