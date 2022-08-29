#!/usr/bin/env python3
import re
import os

while True:
    name = input("Name: ")
    if not re.match(r"^[a-z0-9-]+$", name):
        print("Invalid name")
        continue
    break

os.makedirs(f"scripts/{name}/src")
with open(f"scripts/{name}/banner.js", "w") as f:
    f.write(f"""// ==UserScript==
// @name        {name}
// @version     1.0
// @description TODO_WRITE_DESCRIPTION
// @namespace   https://rinsuki.net/
// @author      rinsuki
// @match       https://tbd.example/
// @grant       none
// ==/UserScript==
""")
with open(f"scripts/{name}/src/index.tsx", "w") as f:
    f.write("alert(1)")
