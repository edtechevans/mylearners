/** Staff names and PLC memberships from the AISG Observations 2026-27 WORKING PLC roster.
 * Names only: no emails, observation comments, results or ratings are imported.
 * All demo classes and students linked to these names are fictional.
 * Source: https://github.com/edtechevans/observations
 */
export const FACULTY_PLCS = {
  "Pre-Kindergarten": [
    "Karen Robb",
    "Jackie Cloete",
    "Maria Evans",
    "Ryan Carter",
    "Ruan Cloete"
  ],
  "Kindergarten": [
    "Kenya Colebrooke",
    "Naomi Ngai",
    "Tammy Wilson",
    "Angela McCloskey"
  ],
  "Grade 1": [
    "Lovina Pinto",
    "Sonia Endara",
    "Cathryn Mund",
    "Joshua Neufeld"
  ],
  "Grade 2": [
    "Kylie M Munce",
    "Leighanna Stewart",
    "Mike Morrison"
  ],
  "Grade 3": [
    "Steph Watkins",
    "Will Henry",
    "Haley Osbourne",
    "Meagan Elderkin"
  ],
  "Grade 4": [
    "Brittany O'Neal",
    "Patricia Inayaty",
    "Narelle Yakas",
    "Kent Watkins"
  ],
  "Grade 5": [
    "Audrey Lawler",
    "Laurie MacNaughton",
    "Taralyn Lefebvre",
    "Mitch Madigan"
  ],
  "Elementary EAL": [
    "Ashley Faulkenberry",
    "Jonathan Tragash",
    "Jake Charles",
    "Kyle Chamberlain",
    "Jessica Davis",
    "Renea Thompson"
  ],
  "Elementary Arts": [
    "Vicki Chen",
    "Amanda Deibert",
    "Phillip Hommes",
    "Tchafikah Buissereth"
  ],
  "Elementary PE": [
    "Charles Rhodes",
    "Joe Dzogazovic",
    "James Ryan"
  ],
  "Elementary Mandarin": [
    "Jean Li",
    "Jenny Bai",
    "Kitty Tang",
    "Jessie Lyu",
    "Lotus Zhou",
    "Lisa Xiong",
    "Angelina Liu"
  ],
  "Elementary Student Support": [
    "Adrienne Johnson",
    "Elliot Fijman",
    "Amelie Sun",
    "Brittany Zhuang",
    "Delissa Job",
    "James Ryan",
    "Rana Cheatwood"
  ],
  "Secondary Arts & Design": [
    "Jason Boyd",
    "Siddhartha Bose",
    "Peter Pagett",
    "Cyril Udall",
    "Lisamary Guiliany Zambrano",
    "Jonetta Loo",
    "Duncan Brain",
    "Maria Plaza Stuve",
    "Nneka Okwuosa",
    "Sebastian Paredes"
  ],
  "Secondary Language Acquisition": [
    "Lisamary Guiliany Zambrano",
    "Gaby Montejano Gauna",
    "Steven Schwab",
    "Sylvie Thimonier",
    "Eric Little",
    "Fuad Hasanagic",
    "Leila El-Murr",
    "Amy Fuang",
    "Bei Lei",
    "Ping Wang"
  ],
  "Secondary Language & Literature": [
    "Audrey Boettcher",
    "Erica Trobridge",
    "Jesse Ridolfo",
    "Jane McGennisken",
    "NamHee Parl",
    "Burke Reed",
    "Cassandra Eagan",
    "Pearl Chen",
    "Joyce Zhang",
    "Juliana Zhu"
  ],
  "Secondary Individuals & Societies": [
    "Alexis Partee",
    "Marlee Charlton",
    "John Munce",
    "Timothy Ackers",
    "James Earwood",
    "Roneil Omadat"
  ],
  "Secondary Mathematics": [
    "Zach Navarro",
    "Esteban Isasi Catala",
    "Irene Peter",
    "Vincent Huang",
    "Mario Fuang",
    "Kennedi Crosby"
  ],
  "Secondary Science": [
    "Michael Hartmann",
    "Shryl Francisco",
    "Alexis Cupp",
    "Briana Clarke",
    "Joseph Boettcher",
    "Adam Abbas",
    "Bruce Steinburg"
  ],
  "Secondary Health & PE": [
    "Erik Schmidt",
    "Diego Buchheim Lopez",
    "Alex Bukenya",
    "Sharon Kemirembe",
    "Emma Ryan"
  ],
  "Secondary Student Support": [
    "Addie Parker",
    "Aaron Beetz",
    "Brittney Young",
    "Yizhou Liu",
    "Nedra Brown",
    "Kade Johnson",
    "Nikki Bunnell",
    "Anh, Nguyen"
  ]
};
export const FACULTY_NAMES = [...new Set(Object.values(FACULTY_PLCS).flat())].sort((a,b)=>a.localeCompare(b,'en'));
