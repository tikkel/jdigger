#!/bin/bash

i=0;
room_num=1;

(
echo -n "// SPDX-License-Identifier: GPL-3.0
// jdigger/levelsx1.js - original XDigger-Leveldatei von https://zenway.ru/page/xdigger
// Copyright (C) 2017–2025  Marko Klingner

room = [
";

while [ $i -lt 4680 ]
do
    xxd -s$i -l156 -i -c10 -a xdigger.level | \
        sed "s|unsigned\ char\ xdigger\_level\[\]\ \=|\[ // Raum $room_num|g";
    i=$[ $i+156 ];
    room_num=$[ $room_num+1 ];
done | \
    sed -z 's|\nunsigned\ int\ xdigger\_level\_len\ \=\ 156\;||g' | \
    sed 's|\ {||g' | \
    sed -z 's|\n\}\;|\]\,|g' | \
    sed '$aende' | \
    sed -z 's|,\nende|\n\];|g';
) > levelsx1.js
