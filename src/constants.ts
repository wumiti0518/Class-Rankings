export interface Member {
  name: string;
  score: number;
  bonus: number;
}

export interface Group {
  id: number;
  leader: string;
  members: Member[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'score' | 'move' | 'reset' | 'leader' | 'save';
  message: string;
  data?: Group[];
}

export const INITIAL_GROUPS: Group[] = [
  { id: 1, leader: "季易", members: [
      { name: "季易", score: 49, bonus: 20 }, { name: "李怡潞", score: 54, bonus: 20 },
      { name: "刘雅萍", score: 29, bonus: 15 }, { name: "任百轩", score: 0, bonus: 0 }
  ]},
  { id: 2, leader: "王悦然", members: [
      { name: "王悦然", score: 42, bonus: 20 }, { name: "桑元辰", score: 45, bonus: 20 },
      { name: "李浩然", score: 28, bonus: 15 }, { name: "贾宇菡", score: 27, bonus: 0 }
  ]},
  { id: 3, leader: "叶宜扬", members: [
      { name: "叶宜扬", score: 10, bonus: 20 }, { name: "臧亦宁", score: -11, bonus: 20 },
      { name: "陈思菡", score: 39, bonus: 20 }, { name: "李沅锴", score: -10, bonus: 15 }
  ]},
  { id: 4, leader: "池金宣", members: [
      { name: "池金宣", score: 64, bonus: 20 }, { name: "周倩汝", score: 32, bonus: 20 },
      { name: "李君诺", score: -19, bonus: 20 }, { name: "任政杭", score: 18, bonus: 0 }
  ]},
  { id: 5, leader: "吕冠润", members: [
      { name: "吕冠润", score: 94, bonus: 20 }, { name: "张雅萱", score: 28, bonus: 20 },
      { name: "李梓冉", score: 53, bonus: 20 }, { name: "宋坤恩", score: -1, bonus: 0 }
  ]},
  { id: 6, leader: "李梓溢", members: [
      { name: "李梓溢", score: 17, bonus: 20 }, { name: "杨汇婕", score: 35, bonus: 20 },
      { name: "王琳皓", score: 4, bonus: 15 }, { name: "姚幸辰", score: -8, bonus: 15 }
  ]},
  { id: 7, leader: "王艺然", members: [
      { name: "王艺然", score: 29, bonus: 20 }, { name: "孙梓荣", score: 9, bonus: 20 },
      { name: "郭俊秀", score: 26, bonus: 15 }, { name: "曲政霖", score: -23, bonus: 15 }
  ]},
  { id: 8, leader: "朱卉童", members: [
      { name: "朱卉童", score: 64, bonus: 20 }, { name: "王瀚彬", score: -5, bonus: 20 },
      { name: "孙玮泽", score: -5, bonus: 15 }, { name: "杨惠茜", score: 26, bonus: 15 }
  ]},
  { id: 9, leader: "周思言", members: [
      { name: "周思言", score: 34, bonus: 20 }, { name: "施柏如", score: 22, bonus: 20 },
      { name: "宋宜坤", score: -13, bonus: 15 }, { name: "马畅", score: 24, bonus: 15 }
  ]},
  { id: 10, leader: "戚子墨", members: [
      { name: "戚子墨", score: 41, bonus: 20 }, { name: "姜颂恩", score: 41, bonus: 20 },
      { name: "孙铭璐", score: 49, bonus: 20 }, { name: "刘奕妙", score: 37, bonus: 0 }
  ]},
  { id: 11, leader: "张茗涵", members: [
      { name: "张茗涵", score: 32, bonus: 20 }, { name: "韩尚朋", score: 32, bonus: 20 },
      { name: "阴航锐", score: -24, bonus: 15 }, { name: "王梓潞", score: 15, bonus: 0 }
  ]},
  { id: 12, leader: "刘子阳", members: [
      { name: "刘子阳", score: 23, bonus: 20 }, { name: "韩亚静", score: 74, bonus: 20 },
      { name: "苑雨彤", score: 30, bonus: 15 }, { name: "张家铭", score: -19, bonus: 15 }
  ]},
  { id: 13, leader: "徐鸣骏", members: [
      { name: "徐鸣骏", score: 28, bonus: 20 }, { name: "王中轩", score: -18, bonus: 15 },
      { name: "杜怡斐", score: 8, bonus: 15 }
  ]}
];
