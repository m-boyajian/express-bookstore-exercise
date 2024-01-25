process.env.NODE_ENV = "test";

const app = require("../app");
const db = require("../db");
const request = require("supertest");

let book_isbn; 
let counter = 1;

beforeEach(async function () {
  await db.query('DELETE FROM books');
  const uniqueIsbn = `000000000${counter++}`.slice(-10);
  let result = await db.query(
    `INSERT INTO
      books(isbn, amazon_url, author, language, pages, publisher, title, year)
      VALUES(
        '${uniqueIsbn}',
        'https://www.amazon.com/Brave-New-World-Aldous-Huxley/dp/0060850523/ref=sr_1_1?keywords=brave+new+world&qid=1706146715&sr=8-1',
        'Aldous Huxley',
        'English',
        288,
        'Harper Perennial',
        'Brave New World',
        1932)
      RETURNING isbn`);
  book_isbn = result.rows[0].isbn;
});

describe("GET /books", function () {
  test("responds with a list of all books", async function () {
    const response = await request(app).get("/books");
    expect(response.statusCode).toBe(200);
    expect(response.body.books).toHaveLength(1);
    expect(response.body.books[0]).toHaveProperty("pages");
  });
});

describe("GET /books/:isbn", function () {
  test("responds with a single book by ID", async function () {
    const response = await request(app)
      .get(`/books/${book_isbn}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.book.isbn).toBe(book_isbn);
  });
});

describe("POST /books", function () {
  test("creates a new book", async function () {

    const response = await request(app)
    .post("/books")
    .send({
      isbn: '039474067X',
      amazon_url: "https://www.amazon.com/Orientalism-Edward-W-Said/dp/039474067X",
      author: "Edward Said",
      language: "English",
      pages: 368,
      publisher: "Vintage",
      title: "Orientalism",
      year: 1979
    });
    expect(response.statusCode).toBe(201);
  });

  test("responds with a 400 Bad Request for invalid book author", async function () {
    const response = await request(app)
      .post("/books")
      .send({ author: "Edward Said" });
    
    expect(response.statusCode).toBe(400);
  });
});
