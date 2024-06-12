function result = objective(x, w, coef1, coef2, x_min, x_max, y_min, y_max, z_min, z_max)
    result = (sum(x) - x_min) / (x_max - x_min) + ...
        coef1 * (max(x) - y_min) / (y_max - y_min);
    if z_max - z_min > 0
         result = result + coef2 * (sum(w) - z_min) / (z_max - z_min);
    end
end