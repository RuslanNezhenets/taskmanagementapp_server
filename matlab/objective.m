function result = objective(x, w, coef1, coef2)
    result = sum(x) + coef1 * max(x) + coef2 * sum(w);
end