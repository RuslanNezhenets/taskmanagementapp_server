function result = I(x, i, j, t, r)
    if x(j) - t(j) <= x(i) - t(i) && x(i) - t(i) < x(j) && r(i) == r(j)
        result = 1;
    else
        result = 0;
    end
end

