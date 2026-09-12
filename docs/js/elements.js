/* elements.js — ธาตุ 36 ตัวแรก สำหรับแบบจำลองอะตอมของบอร์ (Bohr model) */
window.ELEMENTS = (() => {
  // [Z, symbol, ชื่อไทย, English, mass, group(col), period(row), category, shells]
  const raw = [
    [1, 'H', 'ไฮโดรเจน', 'Hydrogen', 1, 1, 1, 'nonmetal', [1]],
    [2, 'He', 'ฮีเลียม', 'Helium', 4, 18, 1, 'noble', [2]],
    [3, 'Li', 'ลิเทียม', 'Lithium', 7, 1, 2, 'alkali', [2, 1]],
    [4, 'Be', 'เบริลเลียม', 'Beryllium', 9, 2, 2, 'alkaline', [2, 2]],
    [5, 'B', 'โบรอน', 'Boron', 11, 13, 2, 'metalloid', [2, 3]],
    [6, 'C', 'คาร์บอน', 'Carbon', 12, 14, 2, 'nonmetal', [2, 4]],
    [7, 'N', 'ไนโตรเจน', 'Nitrogen', 14, 15, 2, 'nonmetal', [2, 5]],
    [8, 'O', 'ออกซิเจน', 'Oxygen', 16, 16, 2, 'nonmetal', [2, 6]],
    [9, 'F', 'ฟลูออรีน', 'Fluorine', 19, 17, 2, 'halogen', [2, 7]],
    [10, 'Ne', 'นีออน', 'Neon', 20, 18, 2, 'noble', [2, 8]],
    [11, 'Na', 'โซเดียม', 'Sodium', 23, 1, 3, 'alkali', [2, 8, 1]],
    [12, 'Mg', 'แมกนีเซียม', 'Magnesium', 24, 2, 3, 'alkaline', [2, 8, 2]],
    [13, 'Al', 'อะลูมิเนียม', 'Aluminium', 27, 13, 3, 'post', [2, 8, 3]],
    [14, 'Si', 'ซิลิคอน', 'Silicon', 28, 14, 3, 'metalloid', [2, 8, 4]],
    [15, 'P', 'ฟอสฟอรัส', 'Phosphorus', 31, 15, 3, 'nonmetal', [2, 8, 5]],
    [16, 'S', 'ซัลเฟอร์', 'Sulfur', 32, 16, 3, 'nonmetal', [2, 8, 6]],
    [17, 'Cl', 'คลอรีน', 'Chlorine', 35, 17, 3, 'halogen', [2, 8, 7]],
    [18, 'Ar', 'อาร์กอน', 'Argon', 40, 18, 3, 'noble', [2, 8, 8]],
    [19, 'K', 'โพแทสเซียม', 'Potassium', 39, 1, 4, 'alkali', [2, 8, 8, 1]],
    [20, 'Ca', 'แคลเซียม', 'Calcium', 40, 2, 4, 'alkaline', [2, 8, 8, 2]],
    [21, 'Sc', 'สแกนเดียม', 'Scandium', 45, 3, 4, 'transition', [2, 8, 9, 2]],
    [22, 'Ti', 'ไทเทเนียม', 'Titanium', 48, 4, 4, 'transition', [2, 8, 10, 2]],
    [23, 'V', 'วาเนเดียม', 'Vanadium', 51, 5, 4, 'transition', [2, 8, 11, 2]],
    [24, 'Cr', 'โครเมียม', 'Chromium', 52, 6, 4, 'transition', [2, 8, 13, 1]],
    [25, 'Mn', 'แมงกานีส', 'Manganese', 55, 7, 4, 'transition', [2, 8, 13, 2]],
    [26, 'Fe', 'เหล็ก', 'Iron', 56, 8, 4, 'transition', [2, 8, 14, 2]],
    [27, 'Co', 'โคบอลต์', 'Cobalt', 59, 9, 4, 'transition', [2, 8, 15, 2]],
    [28, 'Ni', 'นิกเกิล', 'Nickel', 59, 10, 4, 'transition', [2, 8, 16, 2]],
    [29, 'Cu', 'ทองแดง', 'Copper', 64, 11, 4, 'transition', [2, 8, 18, 1]],
    [30, 'Zn', 'สังกะสี', 'Zinc', 65, 12, 4, 'transition', [2, 8, 18, 2]],
    [31, 'Ga', 'แกลเลียม', 'Gallium', 70, 13, 4, 'post', [2, 8, 18, 3]],
    [32, 'Ge', 'เจอร์เมเนียม', 'Germanium', 73, 14, 4, 'metalloid', [2, 8, 18, 4]],
    [33, 'As', 'อาร์เซนิก', 'Arsenic', 75, 15, 4, 'metalloid', [2, 8, 18, 5]],
    [34, 'Se', 'ซีลีเนียม', 'Selenium', 79, 16, 4, 'nonmetal', [2, 8, 18, 6]],
    [35, 'Br', 'โบรมีน', 'Bromine', 80, 17, 4, 'halogen', [2, 8, 18, 7]],
    [36, 'Kr', 'คริปทอน', 'Krypton', 84, 18, 4, 'noble', [2, 8, 18, 8]]
  ];
  const cat = {
    alkali: { th: 'โลหะแอลคาไล', color: '#FF8A5B' },
    alkaline: { th: 'โลหะแอลคาไลน์เอิร์ท', color: '#FFC46B' },
    transition: { th: 'โลหะแทรนซิชัน', color: '#E6C27A' },
    post: { th: 'โลหะหลังแทรนซิชัน', color: '#B9C4FF' },
    metalloid: { th: 'กึ่งโลหะ', color: '#7FE0C8' },
    nonmetal: { th: 'อโลหะ', color: '#8FD3FF' },
    halogen: { th: 'แฮโลเจน', color: '#D9A0FF' },
    noble: { th: 'แก๊สมีสกุล', color: '#B44BFF' }
  };
  const list = raw.map(r => ({ z: r[0], sym: r[1], th: r[2], en: r[3], mass: r[4], col: r[5], row: r[6], cat: r[7], shells: r[8], color: cat[r[7]].color, catTh: cat[r[7]].th }));
  const byZ = {}; list.forEach(e => byZ[e.z] = e);
  return { list, byZ, cat };
})();
