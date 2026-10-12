# Генераторы графиков карточек (sparq_cards → chart:{type,size,data})
Размеры слота: XL 936×664 · L 936×440 · M 936×288 · SW 456×760 · SN 296×760. Акцент — один элемент (accent:1). Числа = текст = источник.
| type | data | размеры |
|---|---|---|
| barH | data[{label,value,accent?}], pre, suf | XL L M SW |
| barV | data[…], pre, suf | XL L M |
| stack | parts[{label,value,accent?}], suf | L M |
| line | x[], series[{name,values[],accent?}], pre, area, first | XL L M SW |
| donut | data[{label,value,accent?}], center{value,label}, suf | L M SW |
| timeline | events[{date,label,t?,accent?}] | XL L (гор.) · SW SN (верт.) |
| scale | a{value,text,label}, b{…}, ratioText? | L M |
| sankey | src[{n,v,accent?}], dst[{n,v}], flows[[i,j,v]] | XL L |
| pyramid | tiers[{n,t,cs,accent?}] | XL L |
| funnel | stages[{v,label,accent?}] | L M |
| waffle | value (%), label | L M SW |
| treemap | items[{v,label,accent?}] | XL L SW |
| flow | inputs[{a,b}], output{a,b}, caption | L M |
| chain | cols[{name,accent?,steps[{a,b,ok}]}] | XL |
| hub | center{a,b}, nodes[{a,b}] | XL L |
| matrix | xl[2], yl[2], clusters[{qx,qy,big,rest,accent?}] | XL |
| strip | count, accent[индексы], label, cols? | M L |
| areas | items[{label,w,h,note?,accent?}] | M L |
| steps | items[{text,accent?}], loop | L XL |
| stepLine | points[{t,v,label?,accent?,below?}], threshold{value,label}, axis[{t,label}], max? | L XL |
| reduction | rows[{label,from,to,accent?,conditional?,cutText?}] | M L |
