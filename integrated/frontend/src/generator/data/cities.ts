export interface CityInfo {
  lat: number;
  lng: number;
  tz: number;
  province: string;
}

export const CITIES: Record<string, CityInfo> = {
  // ===== 直辖市 =====
  "北京": { lat: 39.9042, lng: 116.4074, tz: 8, province: "直辖市" },
  "上海": { lat: 31.2304, lng: 121.4737, tz: 8, province: "直辖市" },
  "天津": { lat: 39.3434, lng: 117.3616, tz: 8, province: "直辖市" },
  "重庆": { lat: 29.5630, lng: 106.5516, tz: 8, province: "直辖市" },

  // ===== 黑龙江省 =====
  "哈尔滨": { lat: 45.8038, lng: 126.5350, tz: 8, province: "黑龙江" },
  "齐齐哈尔": { lat: 47.3543, lng: 123.9179, tz: 8, province: "黑龙江" },
  "牡丹江": { lat: 44.5527, lng: 129.6330, tz: 8, province: "黑龙江" },
  "佳木斯": { lat: 46.8001, lng: 130.3188, tz: 8, province: "黑龙江" },
  "大庆": { lat: 46.5893, lng: 125.1036, tz: 8, province: "黑龙江" },
  "绥化": { lat: 46.6535, lng: 126.9694, tz: 8, province: "黑龙江" },
  "黑河": { lat: 50.2451, lng: 127.5286, tz: 8, province: "黑龙江" },
  "伊春": { lat: 47.7275, lng: 128.8410, tz: 8, province: "黑龙江" },
  "鸡西": { lat: 45.3005, lng: 130.9693, tz: 8, province: "黑龙江" },
  "双鸭山": { lat: 46.6431, lng: 131.1577, tz: 8, province: "黑龙江" },
  "七台河": { lat: 45.7712, lng: 131.0031, tz: 8, province: "黑龙江" },
  "鹤岗": { lat: 47.3501, lng: 130.2775, tz: 8, province: "黑龙江" },
  "大兴安岭": { lat: 52.3352, lng: 124.7125, tz: 8, province: "黑龙江" },

  // ===== 吉林省 =====
  "长春": { lat: 43.8171, lng: 125.3235, tz: 8, province: "吉林" },
  "吉林": { lat: 43.8378, lng: 126.5494, tz: 8, province: "吉林" },
  "四平": { lat: 43.1703, lng: 124.3504, tz: 8, province: "吉林" },
  "延边": { lat: 42.9093, lng: 129.5083, tz: 8, province: "吉林" },
  "通化": { lat: 41.7283, lng: 125.9405, tz: 8, province: "吉林" },
  "白城": { lat: 45.6196, lng: 122.8397, tz: 8, province: "吉林" },
  "辽源": { lat: 42.8880, lng: 125.1437, tz: 8, province: "吉林" },
  "松原": { lat: 45.1188, lng: 124.8255, tz: 8, province: "吉林" },
  "白山": { lat: 41.9393, lng: 126.4259, tz: 8, province: "吉林" },
  "公主岭": { lat: 43.5047, lng: 124.8224, tz: 8, province: "吉林" },

  // ===== 辽宁省 =====
  "沈阳": { lat: 41.8057, lng: 123.4315, tz: 8, province: "辽宁" },
  "大连": { lat: 38.9140, lng: 121.6147, tz: 8, province: "辽宁" },
  "鞍山": { lat: 41.1086, lng: 122.9943, tz: 8, province: "辽宁" },
  "抚顺": { lat: 41.8797, lng: 123.9572, tz: 8, province: "辽宁" },
  "本溪": { lat: 41.4870, lng: 123.7664, tz: 8, province: "辽宁" },
  "丹东": { lat: 40.0005, lng: 124.3558, tz: 8, province: "辽宁" },
  "锦州": { lat: 41.0951, lng: 121.1270, tz: 8, province: "辽宁" },
  "营口": { lat: 40.6669, lng: 122.2349, tz: 8, province: "辽宁" },
  "阜新": { lat: 42.0217, lng: 121.6700, tz: 8, province: "辽宁" },
  "辽阳": { lat: 41.2681, lng: 123.2397, tz: 8, province: "辽宁" },
  "铁岭": { lat: 42.2862, lng: 123.8424, tz: 8, province: "辽宁" },
  "朝阳": { lat: 41.5744, lng: 120.4501, tz: 8, province: "辽宁" },
  "盘锦": { lat: 41.1248, lng: 122.0707, tz: 8, province: "辽宁" },
  "葫芦岛": { lat: 40.7510, lng: 120.8369, tz: 8, province: "辽宁" },

  // ===== 河北省 =====
  "石家庄": { lat: 38.0428, lng: 114.5149, tz: 8, province: "河北" },
  "保定": { lat: 38.8739, lng: 115.4646, tz: 8, province: "河北" },
  "唐山": { lat: 39.6292, lng: 118.1802, tz: 8, province: "河北" },
  "秦皇岛": { lat: 39.9354, lng: 119.5981, tz: 8, province: "河北" },
  "邯郸": { lat: 36.6095, lng: 114.4911, tz: 8, province: "河北" },
  "邢台": { lat: 37.0659, lng: 114.5047, tz: 8, province: "河北" },
  "张家口": { lat: 40.7676, lng: 114.8863, tz: 8, province: "河北" },
  "承德": { lat: 40.9510, lng: 117.9328, tz: 8, province: "河北" },
  "沧州": { lat: 38.3037, lng: 116.8388, tz: 8, province: "河北" },
  "廊坊": { lat: 39.5380, lng: 116.6837, tz: 8, province: "河北" },
  "衡水": { lat: 37.7350, lng: 115.6860, tz: 8, province: "河北" },

  // ===== 山东省 =====
  "济南": { lat: 36.6512, lng: 117.1201, tz: 8, province: "山东" },
  "青岛": { lat: 36.0671, lng: 120.3826, tz: 8, province: "山东" },
  "烟台": { lat: 37.4638, lng: 121.4481, tz: 8, province: "山东" },
  "潍坊": { lat: 36.7089, lng: 119.1619, tz: 8, province: "山东" },
  "临沂": { lat: 35.1047, lng: 118.3564, tz: 8, province: "山东" },
  "淄博": { lat: 36.8135, lng: 118.0550, tz: 8, province: "山东" },
  "威海": { lat: 37.5091, lng: 122.1206, tz: 8, province: "山东" },
  "泰安": { lat: 36.2003, lng: 117.0876, tz: 8, province: "山东" },
  "济宁": { lat: 35.4146, lng: 116.5872, tz: 8, province: "山东" },
  "德州": { lat: 37.4355, lng: 116.3575, tz: 8, province: "山东" },
  "枣庄": { lat: 34.8107, lng: 117.3237, tz: 8, province: "山东" },
  "东营": { lat: 37.4339, lng: 118.6747, tz: 8, province: "山东" },
  "聊城": { lat: 36.4560, lng: 115.9802, tz: 8, province: "山东" },
  "菏泽": { lat: 35.2336, lng: 115.4807, tz: 8, province: "山东" },
  "日照": { lat: 35.4164, lng: 119.5272, tz: 8, province: "山东" },
  "滨州": { lat: 37.3835, lng: 117.9707, tz: 8, province: "山东" },

  // ===== 山西省 =====
  "太原": { lat: 37.8706, lng: 112.5489, tz: 8, province: "山西" },
  "大同": { lat: 40.0768, lng: 113.3001, tz: 8, province: "山西" },
  "临汾": { lat: 36.0883, lng: 111.5190, tz: 8, province: "山西" },
  "运城": { lat: 35.0264, lng: 111.0074, tz: 8, province: "山西" },
  "晋中": { lat: 37.6870, lng: 112.7527, tz: 8, province: "山西" },
  "长治": { lat: 36.1954, lng: 113.1163, tz: 8, province: "山西" },
  "晋城": { lat: 35.4907, lng: 112.8518, tz: 8, province: "山西" },
  "忻州": { lat: 38.4166, lng: 112.7342, tz: 8, province: "山西" },
  "吕梁": { lat: 37.5193, lng: 111.1437, tz: 8, province: "山西" },
  "朔州": { lat: 39.3316, lng: 112.4333, tz: 8, province: "山西" },
  "阳泉": { lat: 37.8569, lng: 113.5785, tz: 8, province: "山西" },

  // ===== 河南省 =====
  "郑州": { lat: 34.7466, lng: 113.6253, tz: 8, province: "河南" },
  "洛阳": { lat: 34.6187, lng: 112.4540, tz: 8, province: "河南" },
  "开封": { lat: 34.7971, lng: 114.3073, tz: 8, province: "河南" },
  "南阳": { lat: 32.9907, lng: 112.5285, tz: 8, province: "河南" },
  "新乡": { lat: 35.3030, lng: 113.9268, tz: 8, province: "河南" },
  "安阳": { lat: 36.0976, lng: 114.3931, tz: 8, province: "河南" },
  "许昌": { lat: 34.0357, lng: 113.8264, tz: 8, province: "河南" },
  "平顶山": { lat: 33.7661, lng: 113.1928, tz: 8, province: "河南" },
  "焦作": { lat: 35.2159, lng: 113.2420, tz: 8, province: "河南" },
  "商丘": { lat: 34.4148, lng: 115.6564, tz: 8, province: "河南" },
  "信阳": { lat: 32.1469, lng: 114.0912, tz: 8, province: "河南" },
  "周口": { lat: 33.6262, lng: 114.6970, tz: 8, province: "河南" },
  "驻马店": { lat: 33.0114, lng: 114.0220, tz: 8, province: "河南" },
  "漯河": { lat: 33.5815, lng: 114.0168, tz: 8, province: "河南" },
  "濮阳": { lat: 35.7619, lng: 115.0292, tz: 8, province: "河南" },
  "三门峡": { lat: 34.7732, lng: 111.2002, tz: 8, province: "河南" },
  "鹤壁": { lat: 35.7470, lng: 114.2951, tz: 8, province: "河南" },
  "济源": { lat: 35.0672, lng: 112.6023, tz: 8, province: "河南" },

  // ===== 陕西省 =====
  "西安": { lat: 34.3416, lng: 108.9398, tz: 8, province: "陕西" },
  "咸阳": { lat: 34.3296, lng: 108.7089, tz: 8, province: "陕西" },
  "宝鸡": { lat: 34.3632, lng: 107.2379, tz: 8, province: "陕西" },
  "渭南": { lat: 34.4994, lng: 109.5101, tz: 8, province: "陕西" },
  "汉中": { lat: 33.0677, lng: 107.0280, tz: 8, province: "陕西" },
  "榆林": { lat: 38.2852, lng: 109.7347, tz: 8, province: "陕西" },
  "延安": { lat: 36.5853, lng: 109.4908, tz: 8, province: "陕西" },
  "安康": { lat: 32.6902, lng: 109.0293, tz: 8, province: "陕西" },
  "商洛": { lat: 33.8704, lng: 109.9404, tz: 8, province: "陕西" },
  "铜川": { lat: 34.8967, lng: 108.9458, tz: 8, province: "陕西" },

  // ===== 江苏省 =====
  "南京": { lat: 32.0603, lng: 118.7969, tz: 8, province: "江苏" },
  "苏州": { lat: 31.2989, lng: 120.5853, tz: 8, province: "江苏" },
  "无锡": { lat: 31.4912, lng: 120.3119, tz: 8, province: "江苏" },
  "常州": { lat: 31.8107, lng: 119.9741, tz: 8, province: "江苏" },
  "徐州": { lat: 34.2618, lng: 117.1848, tz: 8, province: "江苏" },
  "南通": { lat: 31.9802, lng: 120.8943, tz: 8, province: "江苏" },
  "扬州": { lat: 32.3942, lng: 119.4127, tz: 8, province: "江苏" },
  "盐城": { lat: 33.3474, lng: 120.1636, tz: 8, province: "江苏" },
  "淮安": { lat: 33.6104, lng: 119.0158, tz: 8, province: "江苏" },
  "镇江": { lat: 32.1878, lng: 119.4258, tz: 8, province: "江苏" },
  "泰州": { lat: 32.4558, lng: 119.9231, tz: 8, province: "江苏" },
  "宿迁": { lat: 33.9630, lng: 118.2752, tz: 8, province: "江苏" },
  "连云港": { lat: 34.5974, lng: 119.2223, tz: 8, province: "江苏" },

  // ===== 浙江省 =====
  "杭州": { lat: 30.2741, lng: 120.1551, tz: 8, province: "浙江" },
  "宁波": { lat: 29.8683, lng: 121.5440, tz: 8, province: "浙江" },
  "温州": { lat: 27.9938, lng: 120.7025, tz: 8, province: "浙江" },
  "嘉兴": { lat: 30.7470, lng: 120.7555, tz: 8, province: "浙江" },
  "绍兴": { lat: 30.0023, lng: 120.5792, tz: 8, province: "浙江" },
  "金华": { lat: 29.0791, lng: 119.6424, tz: 8, province: "浙江" },
  "台州": { lat: 28.6564, lng: 121.4208, tz: 8, province: "浙江" },
  "湖州": { lat: 30.8943, lng: 120.0868, tz: 8, province: "浙江" },
  "衢州": { lat: 28.9359, lng: 118.8741, tz: 8, province: "浙江" },
  "丽水": { lat: 28.4676, lng: 119.9228, tz: 8, province: "浙江" },
  "舟山": { lat: 30.0160, lng: 122.1068, tz: 8, province: "浙江" },

  // ===== 安徽省 =====
  "合肥": { lat: 31.8206, lng: 117.2272, tz: 8, province: "安徽" },
  "芜湖": { lat: 31.3340, lng: 118.4331, tz: 8, province: "安徽" },
  "蚌埠": { lat: 32.9166, lng: 117.3893, tz: 8, province: "安徽" },
  "阜阳": { lat: 32.8901, lng: 115.8142, tz: 8, province: "安徽" },
  "安庆": { lat: 30.5319, lng: 117.1151, tz: 8, province: "安徽" },
  "滁州": { lat: 32.3016, lng: 118.3171, tz: 8, province: "安徽" },
  "马鞍山": { lat: 31.6759, lng: 118.5101, tz: 8, province: "安徽" },
  "宿州": { lat: 33.6464, lng: 116.9639, tz: 8, province: "安徽" },
  "六安": { lat: 31.7343, lng: 116.5206, tz: 8, province: "安徽" },
  "淮南": { lat: 32.6255, lng: 116.9999, tz: 8, province: "安徽" },
  "铜陵": { lat: 30.9085, lng: 117.8121, tz: 8, province: "安徽" },
  "淮北": { lat: 33.9558, lng: 116.7984, tz: 8, province: "安徽" },
  "黄山": { lat: 29.7147, lng: 118.3375, tz: 8, province: "安徽" },
  "亳州": { lat: 33.8446, lng: 115.7790, tz: 8, province: "安徽" },
  "池州": { lat: 30.6564, lng: 117.4847, tz: 8, province: "安徽" },
  "宣城": { lat: 30.9408, lng: 118.7587, tz: 8, province: "安徽" },

  // ===== 湖北省 =====
  "武汉": { lat: 30.5928, lng: 114.3055, tz: 8, province: "湖北" },
  "宜昌": { lat: 30.6919, lng: 111.2864, tz: 8, province: "湖北" },
  "襄阳": { lat: 32.0090, lng: 112.1225, tz: 8, province: "湖北" },
  "荆州": { lat: 30.3352, lng: 112.2397, tz: 8, province: "湖北" },
  "十堰": { lat: 32.6292, lng: 110.7980, tz: 8, province: "湖北" },
  "黄石": { lat: 30.2000, lng: 115.0389, tz: 8, province: "湖北" },
  "孝感": { lat: 30.9258, lng: 113.9109, tz: 8, province: "湖北" },
  "黄冈": { lat: 30.4539, lng: 114.8723, tz: 8, province: "湖北" },
  "恩施": { lat: 30.2950, lng: 109.4882, tz: 8, province: "湖北" },
  "荆门": { lat: 31.0355, lng: 112.1994, tz: 8, province: "湖北" },
  "咸宁": { lat: 29.8416, lng: 114.3225, tz: 8, province: "湖北" },
  "鄂州": { lat: 30.3904, lng: 114.8949, tz: 8, province: "湖北" },
  "随州": { lat: 31.6909, lng: 113.3825, tz: 8, province: "湖北" },
  "潜江": { lat: 30.4212, lng: 112.8965, tz: 8, province: "湖北" },
  "天门": { lat: 30.6630, lng: 113.1660, tz: 8, province: "湖北" },
  "仙桃": { lat: 30.3645, lng: 113.4541, tz: 8, province: "湖北" },

  // ===== 湖南省 =====
  "长沙": { lat: 28.2280, lng: 112.9388, tz: 8, province: "湖南" },
  "株洲": { lat: 27.8278, lng: 113.1340, tz: 8, province: "湖南" },
  "衡阳": { lat: 26.8932, lng: 112.5719, tz: 8, province: "湖南" },
  "湘潭": { lat: 27.8308, lng: 112.9445, tz: 8, province: "湖南" },
  "岳阳": { lat: 29.3571, lng: 113.1292, tz: 8, province: "湖南" },
  "常德": { lat: 29.0316, lng: 111.6988, tz: 8, province: "湖南" },
  "邵阳": { lat: 27.2389, lng: 111.4678, tz: 8, province: "湖南" },
  "益阳": { lat: 28.5545, lng: 112.3552, tz: 8, province: "湖南" },
  "永州": { lat: 26.4204, lng: 111.5928, tz: 8, province: "湖南" },
  "张家界": { lat: 29.1171, lng: 110.4792, tz: 8, province: "湖南" },
  "怀化": { lat: 27.5501, lng: 109.9786, tz: 8, province: "湖南" },
  "娄底": { lat: 27.7282, lng: 112.0085, tz: 8, province: "湖南" },
  "郴州": { lat: 25.7705, lng: 113.0147, tz: 8, province: "湖南" },
  "湘西": { lat: 28.3119, lng: 109.7397, tz: 8, province: "湖南" },

  // ===== 江西省 =====
  "南昌": { lat: 28.6820, lng: 115.8579, tz: 8, province: "江西" },
  "赣州": { lat: 25.8310, lng: 114.9348, tz: 8, province: "江西" },
  "九江": { lat: 29.7051, lng: 116.0019, tz: 8, province: "江西" },
  "上饶": { lat: 28.4549, lng: 117.9434, tz: 8, province: "江西" },
  "宜春": { lat: 27.8153, lng: 114.4168, tz: 8, province: "江西" },
  "吉安": { lat: 27.1138, lng: 114.9938, tz: 8, province: "江西" },
  "景德镇": { lat: 29.2692, lng: 117.2075, tz: 8, province: "江西" },
  "萍乡": { lat: 27.6228, lng: 113.8543, tz: 8, province: "江西" },
  "抚州": { lat: 27.9492, lng: 116.3582, tz: 8, province: "江西" },
  "新余": { lat: 27.8178, lng: 114.9171, tz: 8, province: "江西" },
  "鹰潭": { lat: 28.2602, lng: 117.0689, tz: 8, province: "江西" },

  // ===== 四川省 =====
  "成都": { lat: 30.5728, lng: 104.0668, tz: 8, province: "四川" },
  "绵阳": { lat: 31.4675, lng: 104.6785, tz: 8, province: "四川" },
  "德阳": { lat: 31.1269, lng: 104.3980, tz: 8, province: "四川" },
  "宜宾": { lat: 28.7513, lng: 104.6417, tz: 8, province: "四川" },
  "南充": { lat: 30.8378, lng: 106.1107, tz: 8, province: "四川" },
  "泸州": { lat: 28.8718, lng: 105.4423, tz: 8, province: "四川" },
  "乐山": { lat: 29.5820, lng: 103.7656, tz: 8, province: "四川" },
  "达州": { lat: 31.2086, lng: 107.4679, tz: 8, province: "四川" },
  "自贡": { lat: 29.3390, lng: 104.7784, tz: 8, province: "四川" },
  "内江": { lat: 29.5809, lng: 105.0584, tz: 8, province: "四川" },
  "眉山": { lat: 30.0754, lng: 103.8485, tz: 8, province: "四川" },
  "广安": { lat: 30.4559, lng: 106.6330, tz: 8, province: "四川" },
  "攀枝花": { lat: 26.5823, lng: 101.7187, tz: 8, province: "四川" },
  "广元": { lat: 32.4355, lng: 105.8436, tz: 8, province: "四川" },
  "遂宁": { lat: 30.5329, lng: 105.5927, tz: 8, province: "四川" },
  "资阳": { lat: 30.1286, lng: 104.6279, tz: 8, province: "四川" },
  "雅安": { lat: 29.9805, lng: 103.0133, tz: 8, province: "四川" },
  "阿坝": { lat: 31.8993, lng: 102.2211, tz: 8, province: "四川" },
  "甘孜": { lat: 30.0493, lng: 101.9625, tz: 8, province: "四川" },
  "凉山": { lat: 27.8816, lng: 102.2673, tz: 8, province: "四川" },
  "巴中": { lat: 31.8678, lng: 106.7475, tz: 8, province: "四川" },

  // ===== 贵州省 =====
  "贵阳": { lat: 26.6470, lng: 106.6302, tz: 8, province: "贵州" },
  "遵义": { lat: 27.7254, lng: 106.9274, tz: 8, province: "贵州" },
  "六盘水": { lat: 26.5927, lng: 104.8304, tz: 8, province: "贵州" },
  "安顺": { lat: 26.2531, lng: 105.9476, tz: 8, province: "贵州" },
  "毕节": { lat: 27.3026, lng: 105.2850, tz: 8, province: "贵州" },
  "铜仁": { lat: 27.7183, lng: 109.1896, tz: 8, province: "贵州" },
  "黔南": { lat: 26.2541, lng: 107.5221, tz: 8, province: "贵州" },
  "黔东南": { lat: 26.5832, lng: 107.9812, tz: 8, province: "贵州" },
  "黔西南": { lat: 25.0878, lng: 104.9064, tz: 8, province: "贵州" },

  // ===== 云南省 =====
  "昆明": { lat: 24.8801, lng: 102.8329, tz: 8, province: "云南" },
  "曲靖": { lat: 25.4900, lng: 103.7963, tz: 8, province: "云南" },
  "大理": { lat: 25.6065, lng: 100.2676, tz: 8, province: "云南" },
  "红河": { lat: 23.3631, lng: 103.3749, tz: 8, province: "云南" },
  "玉溪": { lat: 24.3505, lng: 102.5439, tz: 8, province: "云南" },
  "丽江": { lat: 26.8564, lng: 100.2271, tz: 8, province: "云南" },
  "昭通": { lat: 27.3382, lng: 103.7172, tz: 8, province: "云南" },
  "保山": { lat: 25.1121, lng: 99.1618, tz: 8, province: "云南" },
  "楚雄": { lat: 25.0453, lng: 101.5287, tz: 8, province: "云南" },
  "普洱": { lat: 22.8252, lng: 100.9665, tz: 8, province: "云南" },
  "临沧": { lat: 23.8831, lng: 100.0888, tz: 8, province: "云南" },
  "西双版纳": { lat: 22.0074, lng: 100.7978, tz: 8, province: "云南" },
  "文山": { lat: 23.4007, lng: 104.2150, tz: 8, province: "云南" },
  "德宏": { lat: 24.4337, lng: 98.5857, tz: 8, province: "云南" },
  "怒江": { lat: 25.8176, lng: 98.8566, tz: 8, province: "云南" },
  "迪庆": { lat: 27.8191, lng: 99.7022, tz: 8, province: "云南" },

  // ===== 广东省 =====
  "广州": { lat: 23.1291, lng: 113.2644, tz: 8, province: "广东" },
  "深圳": { lat: 22.5431, lng: 114.0579, tz: 8, province: "广东" },
  "佛山": { lat: 23.0218, lng: 113.1219, tz: 8, province: "广东" },
  "东莞": { lat: 23.0207, lng: 113.7518, tz: 8, province: "广东" },
  "惠州": { lat: 23.1115, lng: 114.4168, tz: 8, province: "广东" },
  "中山": { lat: 22.5176, lng: 113.3927, tz: 8, province: "广东" },
  "珠海": { lat: 22.2707, lng: 113.5675, tz: 8, province: "广东" },
  "汕头": { lat: 23.3540, lng: 116.6826, tz: 8, province: "广东" },
  "湛江": { lat: 21.2707, lng: 110.3594, tz: 8, province: "广东" },
  "江门": { lat: 22.5793, lng: 113.0815, tz: 8, province: "广东" },
  "肇庆": { lat: 23.0472, lng: 112.4658, tz: 8, province: "广东" },
  "茂名": { lat: 21.6629, lng: 110.9252, tz: 8, province: "广东" },
  "揭阳": { lat: 23.5497, lng: 116.3728, tz: 8, province: "广东" },
  "清远": { lat: 23.6818, lng: 113.0560, tz: 8, province: "广东" },
  "韶关": { lat: 24.8104, lng: 113.5972, tz: 8, province: "广东" },
  "阳江": { lat: 21.8592, lng: 111.9826, tz: 8, province: "广东" },
  "梅州": { lat: 24.2886, lng: 116.1228, tz: 8, province: "广东" },
  "潮州": { lat: 23.6566, lng: 116.6228, tz: 8, province: "广东" },
  "汕尾": { lat: 22.7863, lng: 115.3752, tz: 8, province: "广东" },
  "河源": { lat: 23.7435, lng: 114.7004, tz: 8, province: "广东" },
  "云浮": { lat: 22.9156, lng: 112.0444, tz: 8, province: "广东" },

  // ===== 广西壮族自治区 =====
  "南宁": { lat: 22.8170, lng: 108.3665, tz: 8, province: "广西" },
  "柳州": { lat: 24.3263, lng: 109.4282, tz: 8, province: "广西" },
  "桂林": { lat: 25.2742, lng: 110.2998, tz: 8, province: "广西" },
  "玉林": { lat: 22.6314, lng: 110.1544, tz: 8, province: "广西" },
  "北海": { lat: 21.4813, lng: 109.1202, tz: 8, province: "广西" },
  "梧州": { lat: 23.4769, lng: 111.2791, tz: 8, province: "广西" },
  "钦州": { lat: 21.9797, lng: 108.6560, tz: 8, province: "广西" },
  "百色": { lat: 23.9023, lng: 106.6194, tz: 8, province: "广西" },
  "贵港": { lat: 23.1115, lng: 109.5989, tz: 8, province: "广西" },
  "贺州": { lat: 24.4046, lng: 111.5666, tz: 8, province: "广西" },
  "河池": { lat: 24.6928, lng: 108.0852, tz: 8, province: "广西" },
  "来宾": { lat: 23.7521, lng: 109.2215, tz: 8, province: "广西" },
  "崇左": { lat: 22.4043, lng: 107.3650, tz: 8, province: "广西" },
  "防城港": { lat: 21.6869, lng: 108.3547, tz: 8, province: "广西" },

  // ===== 海南省 =====
  "海口": { lat: 20.0440, lng: 110.1999, tz: 8, province: "海南" },
  "三亚": { lat: 18.2525, lng: 109.5121, tz: 8, province: "海南" },
  "儋州": { lat: 19.5209, lng: 109.5808, tz: 8, province: "海南" },
  "三沙": { lat: 16.8310, lng: 112.3386, tz: 8, province: "海南" },
  "琼海": { lat: 19.2584, lng: 110.4746, tz: 8, province: "海南" },
  "文昌": { lat: 19.5433, lng: 110.7977, tz: 8, province: "海南" },
  "万宁": { lat: 18.7951, lng: 110.3913, tz: 8, province: "海南" },
  "东方": { lat: 19.0966, lng: 108.6538, tz: 8, province: "海南" },
  "五指山": { lat: 18.7759, lng: 109.5169, tz: 8, province: "海南" },

  // ===== 福建省 =====
  "福州": { lat: 26.0745, lng: 119.2965, tz: 8, province: "福建" },
  "厦门": { lat: 24.4798, lng: 118.0894, tz: 8, province: "福建" },
  "泉州": { lat: 24.8744, lng: 118.6757, tz: 8, province: "福建" },
  "漳州": { lat: 24.5135, lng: 117.6471, tz: 8, province: "福建" },
  "莆田": { lat: 25.4541, lng: 119.0076, tz: 8, province: "福建" },
  "宁德": { lat: 26.6652, lng: 119.5479, tz: 8, province: "福建" },
  "龙岩": { lat: 25.0751, lng: 117.0175, tz: 8, province: "福建" },
  "三明": { lat: 26.2639, lng: 117.6392, tz: 8, province: "福建" },
  "南平": { lat: 27.3318, lng: 118.1204, tz: 8, province: "福建" },

  // ===== 台湾省 =====
  "台北": { lat: 25.0330, lng: 121.5654, tz: 8, province: "台湾" },
  "高雄": { lat: 22.6273, lng: 120.3014, tz: 8, province: "台湾" },
  "台中": { lat: 24.1477, lng: 120.6736, tz: 8, province: "台湾" },
  "台南": { lat: 22.9997, lng: 120.2270, tz: 8, province: "台湾" },
  "基隆": { lat: 25.1276, lng: 121.7392, tz: 8, province: "台湾" },
  "新竹": { lat: 24.8138, lng: 120.9675, tz: 8, province: "台湾" },
  "嘉义": { lat: 23.4797, lng: 120.4488, tz: 8, province: "台湾" },
  "花莲": { lat: 23.9911, lng: 121.6112, tz: 8, province: "台湾" },

  // ===== 内蒙古自治区 =====
  "呼和浩特": { lat: 40.8426, lng: 111.7519, tz: 8, province: "内蒙古" },
  "包头": { lat: 40.6577, lng: 109.8403, tz: 8, province: "内蒙古" },
  "赤峰": { lat: 42.2578, lng: 118.8869, tz: 8, province: "内蒙古" },
  "鄂尔多斯": { lat: 39.6083, lng: 109.7813, tz: 8, province: "内蒙古" },
  "通辽": { lat: 43.6525, lng: 122.2443, tz: 8, province: "内蒙古" },
  "呼伦贝尔": { lat: 49.2122, lng: 119.7658, tz: 8, province: "内蒙古" },
  "巴彦淖尔": { lat: 40.7431, lng: 107.3877, tz: 8, province: "内蒙古" },
  "乌兰察布": { lat: 40.9939, lng: 113.1338, tz: 8, province: "内蒙古" },
  "锡林郭勒": { lat: 43.9335, lng: 116.0477, tz: 8, province: "内蒙古" },
  "兴安": { lat: 46.0737, lng: 122.0675, tz: 8, province: "内蒙古" },
  "阿拉善": { lat: 38.8515, lng: 105.7290, tz: 8, province: "内蒙古" },
  "乌海": { lat: 39.6538, lng: 106.7933, tz: 8, province: "内蒙古" },
  "满洲里": { lat: 49.5914, lng: 117.4800, tz: 8, province: "内蒙古" },

  // ===== 新疆维吾尔自治区 =====
  "乌鲁木齐": { lat: 43.8256, lng: 87.6168, tz: 6, province: "新疆" },
  "喀什": { lat: 39.4677, lng: 75.9938, tz: 6, province: "新疆" },
  "伊犁": { lat: 43.9169, lng: 81.3242, tz: 6, province: "新疆" },
  "克拉玛依": { lat: 45.5799, lng: 84.8893, tz: 6, province: "新疆" },
  "阿克苏": { lat: 41.1681, lng: 80.2638, tz: 6, province: "新疆" },
  "哈密": { lat: 42.8185, lng: 93.5152, tz: 6, province: "新疆" },
  "和田": { lat: 37.1143, lng: 79.9225, tz: 6, province: "新疆" },
  "昌吉": { lat: 44.0114, lng: 87.3040, tz: 6, province: "新疆" },
  "吐鲁番": { lat: 42.9513, lng: 89.1895, tz: 6, province: "新疆" },
  "塔城": { lat: 46.7464, lng: 82.9797, tz: 6, province: "新疆" },
  "阿勒泰": { lat: 47.8483, lng: 88.1397, tz: 6, province: "新疆" },
  "库尔勒": { lat: 41.7259, lng: 86.1746, tz: 6, province: "新疆" },
  "石河子": { lat: 44.3062, lng: 86.0806, tz: 6, province: "新疆" },
  "博尔塔拉": { lat: 44.9058, lng: 82.0670, tz: 6, province: "新疆" },
  "巴音郭楞": { lat: 41.7645, lng: 86.1489, tz: 6, province: "新疆" },

  // ===== 西藏自治区 =====
  "拉萨": { lat: 29.6500, lng: 91.1000, tz: 6, province: "西藏" },
  "日喀则": { lat: 29.2669, lng: 88.8814, tz: 6, province: "西藏" },
  "林芝": { lat: 29.6491, lng: 94.3615, tz: 6, province: "西藏" },
  "昌都": { lat: 31.1407, lng: 97.1722, tz: 6, province: "西藏" },
  "山南": { lat: 28.5561, lng: 92.5566, tz: 6, province: "西藏" },
  "那曲": { lat: 31.4762, lng: 92.0514, tz: 6, province: "西藏" },
  "阿里": { lat: 32.5007, lng: 80.0967, tz: 6, province: "西藏" },

  // ===== 宁夏回族自治区 =====
  "银川": { lat: 38.4872, lng: 106.2309, tz: 8, province: "宁夏" },
  "石嘴山": { lat: 39.0133, lng: 106.3833, tz: 8, province: "宁夏" },
  "吴忠": { lat: 37.9849, lng: 106.1994, tz: 8, province: "宁夏" },
  "中卫": { lat: 37.5140, lng: 105.1896, tz: 8, province: "宁夏" },
  "固原": { lat: 36.0046, lng: 106.2782, tz: 8, province: "宁夏" },

  // ===== 青海省 =====
  "西宁": { lat: 36.6171, lng: 101.7782, tz: 8, province: "青海" },
  "海东": { lat: 36.5020, lng: 102.1043, tz: 8, province: "青海" },
  "海西": { lat: 37.2862, lng: 97.3712, tz: 8, province: "青海" },
  "海南": { lat: 36.2865, lng: 100.6203, tz: 8, province: "青海" },
  "海北": { lat: 36.9607, lng: 100.9005, tz: 8, province: "青海" },
  "黄南": { lat: 35.5196, lng: 102.0180, tz: 8, province: "青海" },
  "果洛": { lat: 34.4710, lng: 100.2450, tz: 8, province: "青海" },
  "玉树": { lat: 33.0113, lng: 97.0064, tz: 8, province: "青海" },

  // ===== 甘肃省 =====
  "兰州": { lat: 36.0611, lng: 103.8343, tz: 8, province: "甘肃" },
  "天水": { lat: 34.5809, lng: 105.7249, tz: 8, province: "甘肃" },
  "酒泉": { lat: 39.7431, lng: 98.4936, tz: 8, province: "甘肃" },
  "张掖": { lat: 38.9259, lng: 100.4498, tz: 8, province: "甘肃" },
  "武威": { lat: 37.9283, lng: 102.6384, tz: 8, province: "甘肃" },
  "白银": { lat: 36.5447, lng: 104.1385, tz: 8, province: "甘肃" },
  "平凉": { lat: 35.5431, lng: 106.6847, tz: 8, province: "甘肃" },
  "陇南": { lat: 33.3882, lng: 104.9218, tz: 8, province: "甘肃" },
  "定西": { lat: 35.5796, lng: 104.6263, tz: 8, province: "甘肃" },
  "庆阳": { lat: 35.7146, lng: 107.6436, tz: 8, province: "甘肃" },
  "临夏": { lat: 35.6040, lng: 103.2118, tz: 8, province: "甘肃" },
  "嘉峪关": { lat: 39.7720, lng: 98.2901, tz: 8, province: "甘肃" },
  "金昌": { lat: 38.5139, lng: 102.1884, tz: 8, province: "甘肃" },
  "甘南": { lat: 34.9834, lng: 102.9114, tz: 8, province: "甘肃" },

  // ===== 香港特别行政区 =====
  "香港": { lat: 22.3193, lng: 114.1694, tz: 8, province: "香港" },

  // ===== 澳门特别行政区 =====
  "澳门": { lat: 22.1987, lng: 113.5439, tz: 8, province: "澳门" },
};

// Province-organized city list for dropdown
export function getCitiesByProvince(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [city, info] of Object.entries(CITIES)) {
    if (!result[info.province]) result[info.province] = [];
    result[info.province].push(city);
  }
  // Sort cities within each province
  for (const province of Object.keys(result)) {
    result[province].sort();
  }
  return result;
}

export function searchCities(query: string): string[] {
  if (!query) return [];
  const q = query.toLowerCase();
  return Object.keys(CITIES).filter(city => city.toLowerCase().includes(q));
}

export function getCityInfo(city: string): CityInfo | undefined {
  return CITIES[city];
}
