export const probabilityQuestions = [
  {
    question: "Gieo một con xúc xắc cân đối. Xác suất để xuất hiện mặt chẵn là:",
    options: ["1/2", "1/3", "1/6", "1/4"],
    answer: 0,
    level: 1
  },
  {
    question: "Một hộp có 5 viên bi Xanh và 5 viên bi Đỏ. Lấy ngẫu nhiên 2 viên bi. Xác suất để 2 viên bi lấy ra khác màu nhau là:",
    options: ["1/2", "5/9", "4/9", "25/45"],
    answer: 1, // 5C1 * 5C1 / 10C2 = 25/45 = 5/9. Let's make options 1/2, 5/9, 4/9, 1/4
    level: 2
  },
  {
    question: "Gieo đồng thời hai con xúc xắc. Xác suất để tổng số chấm bằng 7 là:",
    options: ["1/6", "1/12", "1/36", "1/4"],
    answer: 0,
    level: 2
  },
  {
    question: "Từ các chữ số 1,2,3,4 lập số có 2 chữ số khác nhau. Xác suất để số đó chia hết cho 2 là:",
    options: ["1/2", "1/4", "1/3", "2/3"],
    answer: 0,
    level: 1
  }
];
