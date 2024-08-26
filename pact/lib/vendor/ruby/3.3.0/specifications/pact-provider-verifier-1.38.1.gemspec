# -*- encoding: utf-8 -*-
# stub: pact-provider-verifier 1.38.1 ruby lib

Gem::Specification.new do |s|
  s.name = "pact-provider-verifier".freeze
  s.version = "1.38.1".freeze

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Matt Fellows".freeze, "Beth Skurrie".freeze]
  s.date = "2024-08-07"
  s.description = "A cross-platform Pact verification tool to validate API Providers.\n                      Used in the pact-js-provider project to simplify development".freeze
  s.email = ["m@onegeek.com.au".freeze, "beth@bethesque.com".freeze]
  s.executables = ["pact-provider-verifier".freeze]
  s.files = ["bin/pact-provider-verifier".freeze]
  s.homepage = "https://github.com/pact-foundation/pact-provider-verifier".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.5.17".freeze
  s.summary = "Provides a Pact verification service for use with Pact".freeze

  s.installed_by_version = "3.5.11".freeze if s.respond_to? :installed_by_version

  s.specification_version = 4

  s.add_runtime_dependency(%q<rspec>.freeze, ["~> 3.5".freeze])
  s.add_runtime_dependency(%q<pact>.freeze, ["~> 1.59".freeze])
  s.add_runtime_dependency(%q<pact-message>.freeze, ["~> 0.5".freeze])
  s.add_runtime_dependency(%q<faraday>.freeze, ["~> 2.5".freeze])
  s.add_runtime_dependency(%q<faraday-retry>.freeze, ["~> 2.2".freeze])
  s.add_runtime_dependency(%q<json>.freeze, ["> 1.8".freeze])
  s.add_runtime_dependency(%q<rack>.freeze, ["~> 2.1".freeze])
  s.add_runtime_dependency(%q<rack-reverse-proxy>.freeze, [">= 0".freeze])
  s.add_runtime_dependency(%q<rspec_junit_formatter>.freeze, ["~> 0.3".freeze])
  s.add_development_dependency(%q<rake>.freeze, ["~> 13.0".freeze])
  s.add_development_dependency(%q<sinatra>.freeze, [">= 0".freeze])
  s.add_development_dependency(%q<sinatra-contrib>.freeze, [">= 0".freeze])
  s.add_development_dependency(%q<octokit>.freeze, ["~> 4.7".freeze])
  s.add_development_dependency(%q<webmock>.freeze, ["~> 3.0".freeze])
  s.add_development_dependency(%q<conventional-changelog>.freeze, ["~> 1.2".freeze])
  s.add_development_dependency(%q<pry-byebug>.freeze, ["~> 3.4".freeze])
  s.add_development_dependency(%q<find_a_port>.freeze, ["~> 1.0".freeze])
  s.add_development_dependency(%q<bump>.freeze, ["~> 0.5".freeze])
  s.add_development_dependency(%q<word_wrap>.freeze, [">= 0".freeze])
end
