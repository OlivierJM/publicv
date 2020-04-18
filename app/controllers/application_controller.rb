class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :set_locale
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[first_name last_name tel])
  end

  def set_locale
    I18n.locale = case tld
                  when 'it'
                    :it
                  else
                    :en
                  end
  end

  def tld
    @tld ||= request.host.split('.').last
  end
end
